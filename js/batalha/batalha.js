// =====================================================================
// BATALHA - controla os turnos entre um herói e um monstro.
//
// Ela NÃO faz:
//  - conta de dano        -> CalculadoraDeDano (dano.js)
//  - texto do log         -> Narrador (narrador.js)
//  - o que cada ação faz  -> classes de Acao (acoes.js)
//  - o que cada habilidade/efeito faz -> cada classe de herói, monstro e efeito
// O narrador e o sorteio chegam prontos pelo construtor (Inversão de Dependência).
// =====================================================================

class Batalha {
    constructor(heroi, monstro, narrador, sorteio) {
        this.heroi = heroi;
        this.monstro = monstro;
        this.narrador = narrador;
        this.sorteio = sorteio;
        this.calculadora = new CalculadoraDeDano(sorteio);

        this.acoes = {
            atacar: new Atacar(),
            habilidade: new UsarHabilidade(),
            defender: new Defender(),
            pocao: new UsarPocao()
        };

        this.turno = 1;
        this.pocoes = REGRAS.pocoesPorBatalha;
        this.resultado = null; // "vitoria", "derrota" ou "empate"
        this.recompensaXp = 0;
        this.niveisGanhos = 0;
        this.placar = {
            heroi: { dano: 0, criticos: 0, esquivas: 0, habilidades: 0 },
            monstro: { dano: 0, criticos: 0, esquivas: 0, habilidades: 0 }
        };

        heroi.prepararParaBatalha();
        monstro.prepararParaBatalha();
        this.anunciarInicio();
    }

    terminou() {
        return this.resultado !== null;
    }

    placarDe(combatente) {
        if (combatente === this.heroi) {
            return this.placar.heroi;
        }
        return this.placar.monstro;
    }

    narrar(chave, dados) {
        this.narrador.narrar(chave, dados);
    }

    anunciarInicio() {
        const dados = { heroi: this.heroi, monstro: this.monstro };
        this.narrar("inicio", dados);
        if (this.heroi.multiplicadorContra(this.monstro) > 1) {
            this.narrar("vantagem", dados);
        }
        if (this.monstro.multiplicadorContra(this.heroi) > 1) {
            this.narrar("desvantagem", dados);
        }
    }

    // Um turno completo: o herói age e depois o monstro responde.
    // nomeDaAcao: "atacar", "habilidade", "defender", "pocao" ou null (automático)
    jogarTurno(nomeDaAcao) {
        if (this.terminou()) {
            return;
        }

        this.narrar("turno", { numero: this.turno });

        this.agir(this.heroi, this.monstro, nomeDaAcao);
        if (this.verificarFim()) {
            return;
        }

        this.agir(this.monstro, this.heroi, null);
        if (this.verificarFim()) {
            return;
        }

        this.narrar("hp", { heroi: this.heroi, monstro: this.monstro });
        this.turno++;
        if (this.turno > REGRAS.limiteTurnos) {
            this.resultado = "empate";
            this.narrar("empate", {});
        }
    }

    // Joga a batalha inteira de uma vez (usado nos testes)
    simular() {
        while (!this.terminou()) {
            this.jogarTurno(null);
        }
    }

    agir(ator, alvo, nomeDaAcao) {
        const podeAgir = this.iniciarTurnoDe(ator);

        if (podeAgir) {
            if (nomeDaAcao === null) {
                nomeDaAcao = ator.escolherAcao(this);
            }
            let acao = this.acoes[nomeDaAcao];
            if (acao === undefined || !acao.podeExecutar(ator, this)) {
                acao = this.acoes.atacar;
            }
            acao.executar(ator, alvo, this);
        }

        if (ator.estaVivo()) {
            this.terminarTurnoDe(ator);
        }
    }

    // Efeitos (veneno, cura...) agem no começo do turno.
    // Devolve false se o combatente perdeu a vez.
    iniciarTurnoDe(ator) {
        let perdeAVez = false;

        for (const efeito of ator.getEfeitos()) {
            if (efeito.impedeAcao()) {
                perdeAVez = true;
            }
            efeito.aoIniciarTurno(ator, this);
            efeito.restante--;

            if (efeito.restante <= 0) {
                ator.removerEfeito(efeito.id);
                if (efeito.avisaQuandoTermina()) {
                    this.narrar("fim-efeito", { alvo: ator, efeito: efeito });
                }
            }
            if (!ator.estaVivo()) {
                return false;
            }
        }

        if (perdeAVez) {
            this.narrar("atordoado", { ator: ator });
            return false;
        }
        return true;
    }

    // Recarga, MP e passivas ficam no fim do turno, assim os botões
    // já mostram o estado certo para a próxima escolha do jogador.
    terminarTurnoDe(ator) {
        ator.diminuirRecarga();
        ator.recuperarMp(Math.max(2, ator.getMpMaximo() * REGRAS.regeneracaoMp));
        ator.aoFimDoTurno(this);
    }

    // ---------- Usados pelas ações, habilidades e efeitos ----------

    // Um golpe: esquiva -> crítico -> dano. Devolve true se acertou.
    golpear(atacante, defensor, tipoDano, multiplicador, bonusCritico = 0, nomeDoGolpe = null) {
        const chanceEsquiva = limitar(defensor.getStat("esquiva"), 0, REGRAS.esquivaMaxima);
        if (this.sorteio.chance(chanceEsquiva)) {
            this.narrar("esquiva", { defensor: defensor, defensorEhHeroi: defensor === this.heroi });
            this.placarDe(defensor).esquivas++;
            return false;
        }

        const chanceCritico = limitar(atacante.getStat("critico") + bonusCritico, 0, REGRAS.criticoMaximo);
        const critico = this.sorteio.chance(chanceCritico);
        if (critico) {
            this.narrar("critico", { atacante: atacante });
            this.placarDe(atacante).criticos++;
        }

        const valor = this.calculadora.calcular(atacante, defensor, tipoDano, multiplicador, critico);
        const dano = defensor.receberDano(valor);
        this.placarDe(atacante).dano += dano;
        this.narrar("dano", {
            atacante: atacante,
            defensor: defensor,
            valor: dano,
            tipoDano: tipoDano,
            nomeDoGolpe: nomeDoGolpe
        });
        return true;
    }

    // Igual ao golpear, mas o log mostra o nome da habilidade
    golpearComHabilidade(atacante, defensor, tipoDano, multiplicador, bonusCritico = 0) {
        return this.golpear(atacante, defensor, tipoDano, multiplicador, bonusCritico, atacante.habilidade.nome);
    }

    // chance: % de o efeito pegar (100 = sempre)
    aplicarEfeito(alvo, efeito, chance = 100) {
        if (!this.sorteio.chance(chance)) {
            return;
        }

        if (efeito.resistidoPor !== null) {
            const resistencia = limitar(alvo.getStat(efeito.resistidoPor), 0, REGRAS.resistenciaMaxima);
            if (this.sorteio.chance(resistencia)) {
                this.narrar("resistencia", { alvo: alvo, efeito: efeito });
                return;
            }
        }

        alvo.adicionarEfeito(efeito);
        this.narrar("efeito", { alvo: alvo, efeito: efeito });
    }

    // Dano de veneno, queimadura... conta no placar de quem está do outro lado
    causarDanoDeEfeito(alvo, valor, efeito) {
        const dano = alvo.receberDano(valor);
        if (alvo === this.heroi) {
            this.placar.monstro.dano += dano;
        } else {
            this.placar.heroi.dano += dano;
        }
        this.narrar("dano-efeito", { alvo: alvo, valor: dano, efeito: efeito });
    }

    // ---------- Fim da batalha ----------

    verificarFim() {
        const dados = { heroi: this.heroi, monstro: this.monstro };

        if (!this.monstro.estaVivo()) {
            this.resultado = "vitoria";
            this.narrar("vitoria", dados);
            this.entregarRecompensa();
        } else if (!this.heroi.estaVivo()) {
            this.resultado = "derrota";
            this.narrar("derrota", dados);
        }
        return this.terminou();
    }

    entregarRecompensa() {
        if (this.heroi.estaNoNivelMaximo()) {
            this.recompensaXp = 0;
            this.narrar("nivel-maximo", { heroi: this.heroi });
            return;
        }

        this.recompensaXp = this.monstro.calcularXp(this.heroi.nivel);
        this.narrar("xp", { heroi: this.heroi, valor: this.recompensaXp });

        this.niveisGanhos = this.heroi.ganharXp(this.recompensaXp);
        if (this.niveisGanhos > 0) {
            this.narrar("subiu-nivel", { heroi: this.heroi });
        }
    }
}
