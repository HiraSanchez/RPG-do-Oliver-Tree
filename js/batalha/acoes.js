// =====================================================================
// AÇÕES DO TURNO (Atacar, Habilidade, Defender, Poção)
// Cada ação é uma classe. A Batalha guarda uma lista delas e só chama
// executar(), sem precisar de um switch. Para criar uma ação nova é
// só criar outra classe e injetá-la pelo ponto de composição (fabrica.js).
// =====================================================================

class Acao {
    constructor() {
        if (new.target === Acao) {
            throw new Error("Acao é uma classe abstrata.");
        }
    }

    // A ação pode ser usada agora? (ex.: poção só se ainda tiver poção)
    podeExecutar(ator, batalha) {
        return true;
    }

    executar(ator, alvo, batalha) {
        throw new Error("A classe " + this.constructor.name + " precisa implementar executar().");
    }
}

class Atacar extends Acao {
    executar(ator, alvo, batalha) {
        batalha.golpear(ator, alvo, ator.ataqueBasico, 1);
    }
}

class UsarHabilidade extends Acao {
    podeExecutar(ator, batalha) {
        return ator.podeUsarHabilidade();
    }

    executar(ator, alvo, batalha) {
        ator.gastarMp(ator.habilidade.custo);
        ator.iniciarRecarga();
        batalha.placarDe(ator).habilidades++;
        batalha.narrar("habilidade", { ator: ator });

        // cada classe faz a sua habilidade do seu jeito (polimorfismo)
        ator.usarHabilidade(alvo, batalha);
    }
}

class Defender extends Acao {
    executar(ator, alvo, batalha) {
        ator.adicionarEfeito(new Defendendo());
        const mp = ator.recuperarMp(ator.getMpMaximo() * REGRAS.mpAoDefender);
        batalha.narrar("defesa", { ator: ator, valor: mp });
    }
}

class UsarPocao extends Acao {
    // Só o herói carrega poções
    podeExecutar(ator, batalha) {
        return ator === batalha.heroi && batalha.pocoes > 0;
    }

    executar(ator, alvo, batalha) {
        if (!batalha.inventario.consumir("pocao")) return;
        const curado = ator.curar(ator.getHpMaximo() * REGRAS.curaPocao);
        batalha.narrar("pocao", { ator: ator, valor: curado, restantes: batalha.pocoes });
    }
}
