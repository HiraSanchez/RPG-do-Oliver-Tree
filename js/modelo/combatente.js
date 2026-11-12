// =====================================================================
// COMBATENTE - classe base (abstrata) de tudo que luta.
// Heroi (herois.js) e Monstro (monstros.js) herdam desta classe.
// HP, MP, efeitos e leitura das estatísticas ficam aqui, uma vez só.
// =====================================================================

class Combatente {
    // Campos privados (encapsulamento): só podem ser mudados pelos métodos
    // desta classe, por exemplo receberDano(), curar() e iniciarRecarga().
    #base;
    #hp;
    #mp;
    #efeitos;
    #recarga; // turnos até a habilidade poder ser usada de novo
    #efeitosDaRodada = [];

    constructor(nome, imagem, nivel, estatisticas, ataqueBasico) {
        // Não faz sentido existir um "Combatente" genérico, só Heróis e Monstros
        if (new.target === Combatente) {
            throw new Error("Combatente é uma classe abstrata. Crie um Heroi ou um Monstro.");
        }
        if (!Number.isInteger(nivel) || nivel < 1 || nivel > REGRAS.nivelMaximo + 2) {
            throw new RangeError("Nível inválido.");
        }
        this.nome = nome;
        this.imagem = imagem;
        this.nivel = nivel;
        this.ataqueBasico = ataqueBasico; // "fisico", "magico", "veneno" ou "sagrado"
        this.definirEstatisticas(estatisticas);
        this.#hp = this.#base.hp;
        this.#mp = this.#base.mp;
        this.#efeitos = [];
        this.#recarga = 0;
    }

    // Guarda as estatísticas, colocando 0 nas que não foram informadas
    definirEstatisticas(estatisticas) {
        const base = {};
        for (const nome in ESTATISTICAS) {
            base[nome] = numeroNaoNegativo(estatisticas[nome] ?? 0, nome);
        }
        this.#base = base;
        // se o HP máximo diminuir, o HP atual acompanha
        if (this.#hp > this.#base.hp) {
            this.#hp = this.#base.hp;
        }
        if (this.#mp > this.#base.mp) this.#mp = this.#base.mp;
    }

    // ---------- HP e MP ----------

    getHp() {
        return this.#hp;
    }

    getMp() {
        return this.#mp;
    }

    getHpMaximo() {
        return this.#base.hp;
    }

    getMpMaximo() {
        return this.#base.mp;
    }

    estaVivo() {
        return this.#hp > 0;
    }

    // Os métodos abaixo devolvem quanto realmente mudou (usado no log)
    receberDano(valor) {
        const dano = Math.min(this.#hp, Math.round(numeroNaoNegativo(valor)));
        this.#hp = this.#hp - dano;
        return dano;
    }

    curar(valor) {
        const cura = Math.min(this.getHpMaximo() - this.#hp, Math.round(numeroNaoNegativo(valor)));
        this.#hp = this.#hp + cura;
        return cura;
    }

    recuperarMp(valor) {
        const recuperado = Math.min(this.getMpMaximo() - this.#mp, Math.round(numeroNaoNegativo(valor)));
        this.#mp = this.#mp + recuperado;
        return recuperado;
    }

    gastarMp(valor) {
        const gasto = Math.min(this.#mp, Math.round(numeroNaoNegativo(valor)));
        this.#mp = this.#mp - gasto;
        return gasto;
    }

    // Antes de cada luta: vida e MP cheios, sem efeitos e sem recarga
    prepararParaBatalha() {
        this.#hp = this.getHpMaximo();
        this.#mp = this.getMpMaximo();
        this.#efeitos = [];
        this.#recarga = 0;
        this.#efeitosDaRodada = [];
    }

    // ---------- Estatísticas ----------

    // Valor sem os efeitos (é o que aparece na ficha)
    getStatBase(nome) {
        if (this.#base[nome] === undefined) {
            return 0;
        }
        return this.#base[nome];
    }

    // Valor atual, somando os bônus e penalidades dos efeitos ativos.
    // Os efeitos não mudam a base, então nada fica "preso" quando acabam.
    getStat(nome) {
        let valor = this.getStatBase(nome);
        let percentual = 0;
        for (const efeito of this.#efeitos) {
            valor = valor + efeito.bonus(nome);
            percentual = percentual + efeito.bonusPercentual(nome);
        }
        return limitar(valor * (1 + percentual / 100), 0, limiteEstatistica(nome));
    }

    // ---------- Efeitos ----------

    // A interface recebe somente descrições imutáveis, nunca os efeitos internos.
    getEfeitos() {
        return Object.freeze(this.#efeitos.map(efeito => Object.freeze({
            id: efeito.id, nome: efeito.nome, tipo: efeito.tipo, restante: efeito.restante
        })));
    }

    multiplicadorDanoRecebido() {
        return this.#efeitos.reduce((valor, efeito) => valor * efeito.multiplicadorDanoRecebido(), 1);
    }

    iniciarRodada() {
        this.#efeitosDaRodada = this.#efeitos.slice();
    }

    finalizarRodada(batalha) {
        for (const efeito of this.#efeitosDaRodada) {
            if (efeito.relogio === "rodada" && this.#efeitos.includes(efeito)) {
                this.consumirDuracao(efeito, batalha);
            }
        }
        this.#efeitosDaRodada = [];
    }

    processarEfeitos(batalha) {
        let podeAgir = this.estaVivo();
        for (const efeito of this.#efeitos.slice()) {
            if (!this.estaVivo()) return false;
            if (efeito.impedeAcao()) podeAgir = false;
            efeito.aoIniciarTurno(this, batalha);
            if (efeito.relogio === "turno") this.consumirDuracao(efeito, batalha);
        }
        if (!podeAgir && this.estaVivo()) batalha.narrar("atordoado", { ator: this });
        return podeAgir && this.estaVivo();
    }

    consumirDuracao(efeito, batalha) {
        efeito.passarTurno();
        if (efeito.restante === 0) {
            this.removerEfeito(efeito.id);
            if (efeito.avisaQuandoTermina()) batalha.narrar("fim-efeito", { alvo: this, efeito });
        }
    }

    temEfeito(id) {
        for (const efeito of this.#efeitos) {
            if (efeito.id === id) {
                return true;
            }
        }
        return false;
    }

    // Se o efeito já está ativo, só renova a duração (não acumula)
    adicionarEfeito(novoEfeito) {
        if (!(novoEfeito instanceof Efeito)) throw new TypeError("Efeito inválido.");
        this.removerEfeito(novoEfeito.id);
        this.#efeitos.push(Object.freeze(novoEfeito));
    }

    removerEfeito(id) {
        this.#efeitos = this.#efeitos.filter(function (efeito) {
            return efeito.id !== id;
        });
    }

    // ---------- Habilidade especial ----------

    podeUsarHabilidade() {
        if (!temHabilidadeEspecial(this)) {
            return false;
        }
        return this.#recarga === 0 && this.#mp >= this.habilidade.custo;
    }

    getRecarga() {
        return this.#recarga;
    }

    // Depois de usar a habilidade, ela fica alguns turnos sem poder ser usada
    iniciarRecarga() {
        this.#recarga = this.habilidade.recarga;
    }

    // Chamado no fim de cada turno
    diminuirRecarga() {
        if (this.#recarga > 0) {
            this.#recarga--;
        }
    }

    // ---------- Métodos que as subclasses sobrescrevem (polimorfismo) ----------

    getTitulo() {
        return this.nome;
    }

    // Só heróis têm classe (Guerreiro, Bardo...). Monstros respondem false.
    ehDaClasse(classe) {
        return false;
    }

    getForteContra() {
        return [];
    }

    getFracoContra() {
        return [];
    }

    // Texto da habilidade passiva (vazio = não tem)
    getPassiva() {
        return "";
    }

    // true se esta classe de herói tem vantagem contra mim
    temFraquezaContra(classe) {
        return false;
    }

    // Multiplicador de dano contra um alvo (vantagem de classe)
    multiplicadorContra(alvo) {
        return 1;
    }

    // Chamado no fim de cada turno (passivas, como a regeneração do Ogro)
    aoFimDoTurno(batalha) {
        // por padrão não faz nada
    }

    // Qual ação fazer quando a escolha é automática.
    // Devolve "atacar", "habilidade", "defender" ou "pocao".
    escolherAcao(batalha) {
        throw new Error("A classe " + this.constructor.name + " precisa implementar escolherAcao().");
    }
}


// Equivale ao "instanceof ComHabilidadeEspecial" do exemplo em Java.
// JavaScript não tem interface, então verificamos se o objeto tem o método.
// Assim um combatente sem habilidade não é obrigado a ter um método vazio (ISP).
function temHabilidadeEspecial(combatente) {
    const h = combatente.habilidade;
    return typeof combatente.usarHabilidade === "function" && h != null &&
        Number.isFinite(h.custo) && h.custo >= 0 && Number.isInteger(h.recarga) && h.recarga >= 1;
}
