// =====================================================================
// EFEITOS DE STATUS (veneno, bênção, fúria, atordoado...)
//
// A Batalha não sabe qual efeito é qual: ela só chama os métodos da
// classe Efeito e cada subclasse responde do seu jeito (polimorfismo).
// Para criar um efeito novo é só criar uma classe nova aqui,
// sem mexer na Batalha (princípio Aberto/Fechado).
// =====================================================================

class Efeito {
    constructor(id, nome, duracao, tipo) {
        if (new.target === Efeito) {
            throw new Error("Efeito é uma classe abstrata. Use uma das subclasses.");
        }
        this.id = id;
        this.nome = nome;
        this.duracao = duracao;   // em turnos de quem está com o efeito
        this.restante = duracao;
        this.tipo = tipo;         // só para a cor na tela: dano, cura, mana, buff, debuff, atordoar
        this.resistidoPor = null; // estatística que pode bloquear o efeito (ex.: "resVeneno")
    }

    // Chamado no começo de cada turno de quem está com o efeito
    aoIniciarTurno(alvo, batalha) {
        // a maioria dos efeitos não faz nada aqui
    }

    // Quanto o efeito soma em uma estatística (ex.: +10 de crítico)
    bonus(estatistica) {
        return 0;
    }

    // Quantos % o efeito aumenta ou diminui uma estatística (ex.: +50% de defesa)
    bonusPercentual(estatistica) {
        return 0;
    }

    // Multiplica o dano que quem está com o efeito recebe
    multiplicadorDanoRecebido() {
        return 1;
    }

    // true = quem está com o efeito perde a vez
    impedeAcao() {
        return false;
    }

    // Alguns efeitos acabam sem aviso no log
    avisaQuandoTermina() {
        return true;
    }
}


// ---------- Dano a cada turno ----------

class EfeitoDeDano extends Efeito {
    constructor(id, nome, duracao, dano) {
        super(id, nome, duracao, "dano");
        this.dano = Math.max(1, Math.round(dano));
    }

    aoIniciarTurno(alvo, batalha) {
        batalha.causarDanoDeEfeito(alvo, this.dano, this);
    }
}

class Envenenado extends EfeitoDeDano {
    constructor(dano) {
        super("envenenado", "Envenenado", 3, dano);
        this.resistidoPor = "resVeneno";
    }
}

class Queimando extends EfeitoDeDano {
    constructor(dano) {
        super("queimando", "Queimando", 2, dano);
    }
}


// ---------- Cura a cada turno ----------

class EfeitoDeCura extends Efeito {
    constructor(id, nome, duracao, cura) {
        super(id, nome, duracao, "cura");
        this.cura = Math.max(1, Math.round(cura));
    }

    aoIniciarTurno(alvo, batalha) {
        const curado = alvo.curar(this.cura);
        if (curado > 0) {
            batalha.narrar("cura-efeito", { alvo: alvo, valor: curado, efeito: this });
        }
    }
}

class Bencao extends EfeitoDeCura {
    constructor(cura) {
        super("bencao", "Bênção", 3, cura);
    }
}

class Regeneracao extends EfeitoDeCura {
    constructor(cura) {
        super("regeneracao", "Regeneração", 3, cura);
    }
}


// ---------- MP a cada turno + crítico (Bardo) ----------

class Inspirado extends Efeito {
    constructor(mana) {
        super("inspirado", "Inspirado", 3, "mana");
        this.mana = Math.max(1, Math.round(mana));
    }

    aoIniciarTurno(alvo, batalha) {
        const recuperado = alvo.recuperarMp(this.mana);
        if (recuperado > 0) {
            batalha.narrar("mana-efeito", { alvo: alvo, valor: recuperado, efeito: this });
        }
    }

    bonus(estatistica) {
        if (estatistica === "critico") {
            return 10;
        }
        return 0;
    }
}


// ---------- Aumenta ou diminui atributos ----------

class EfeitoDeAtributo extends Efeito {
    // bonusFixos: { critico: 25 }   percentuais: { defesa: 50 }
    constructor(id, nome, duracao, tipo, bonusFixos, percentuais) {
        super(id, nome, duracao, tipo);
        this.bonusFixos = bonusFixos;
        this.percentuais = percentuais;
    }

    bonus(estatistica) {
        if (this.bonusFixos[estatistica] !== undefined) {
            return this.bonusFixos[estatistica];
        }
        return 0;
    }

    bonusPercentual(estatistica) {
        if (this.percentuais[estatistica] !== undefined) {
            return this.percentuais[estatistica];
        }
        return 0;
    }
}

class MiraPrecisa extends EfeitoDeAtributo {
    constructor() {
        super("miraPrecisa", "Mira Precisa", 3, "buff", { critico: 25 }, {});
    }
}

// Defesa em porcentagem, para continuar valendo nos níveis altos
class Furia extends EfeitoDeAtributo {
    constructor() {
        super("furia", "Fúria", 3, "buff", { critico: 10 }, { defesa: 30 });
    }
}

class FormaDePedra extends EfeitoDeAtributo {
    constructor() {
        super("formaDePedra", "Forma de Pedra", 2, "buff", {}, { defesa: 50, defesaMagica: 50 });
    }
}

class Petrificado extends EfeitoDeAtributo {
    constructor() {
        super("petrificado", "Petrificado", 3, "debuff", {}, { defesa: -30, esquiva: -50 });
    }
}


// ---------- Efeitos especiais ----------

// Perde a próxima vez de jogar
class Atordoado extends Efeito {
    constructor() {
        super("atordoado", "Atordoado", 1, "atordoar");
    }

    impedeAcao() {
        return true;
    }

    avisaQuandoTermina() {
        return false;
    }
}

// Ação "Defender": o próximo dano recebido cai pela metade
class Defendendo extends Efeito {
    constructor() {
        super("defendendo", "Defendendo", 1, "buff");
    }

    multiplicadorDanoRecebido() {
        return 1 - REGRAS.reducaoDefendendo;
    }

    avisaQuandoTermina() {
        return false;
    }
}
