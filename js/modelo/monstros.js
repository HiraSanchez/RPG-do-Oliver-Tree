// =====================================================================
// MONSTROS
// Monstro (abstrata) herda de Combatente. Cada tipo de monstro herda
// de Monstro e implementa a sua habilidade em usarHabilidade().
// =====================================================================

class Monstro extends Combatente {
    constructor(tipo, nivel = 1) {
        if (new.target === Monstro) {
            throw new Error("Monstro é uma classe abstrata. Use um tipo, como Goblin.");
        }
        const dados = DADOS_MONSTROS[tipo];
        const estatisticas = Monstro.calcularEstatisticas(dados.estatisticas, nivel);
        super(tipo, dados.imagem, nivel, estatisticas, dados.ataqueBasico);

        this.tipo = tipo;
        this.fraquezas = dados.fraquezas;
        this.vantagens = dados.vantagens;
    }

    // HP, dano e armadura escalam; MP e resistências mantêm o orçamento.
    // REGRAS.vidaMonstros e REGRAS.danoMonstros deixam todos os monstros
    // mais fortes ou mais fracos de uma vez (usado para balancear o jogo).
    static calcularEstatisticas(valoresNivel1, nivel) {
        const estatisticas = {};
        for (const nome in valoresNivel1) {
            let valor = valoresNivel1[nome];
            if (nome === "hp") {
                valor = valor * REGRAS.vidaMonstros;
            }
            if (TIPOS_DANO[nome] !== undefined) {
                valor = valor * REGRAS.danoMonstros;
            }

            estatisticas[nome] = escalarEstatistica(nome, valor, nivel);
        }
        return estatisticas;
    }

    // O que vai para o localStorage
    paraSalvar() {
        return { tipo: this.tipo, nivel: this.nivel };
    }

    // Recria o monstro salvo. Devolve null se os dados estiverem estragados.
    static carregar(dados) {
        if (!dados || typeof dados.tipo !== "string" || !Object.hasOwn(CLASSES_MONSTROS, dados.tipo)) {
            return null;
        }
        const nivel = dados.nivel ?? 1;
        if (!Number.isInteger(nivel) || nivel < 1 || nivel > REGRAS.nivelMaximo + 2) return null;
        return criarMonstro(dados.tipo, nivel);
    }

    // XP que este monstro dá ao ser derrotado.
    // Monstro mais forte que o herói vale mais; bem mais fraco, vale bem menos.
    calcularXp(nivelDoHeroi) {
        const diferenca = this.nivel - nivelDoHeroi;
        const multiplicador = limitar(1 + 0.25 * diferenca, 0.25, 2);
        return Math.max(1, Math.round(REGRAS.xpPorNivelMonstro * this.nivel * multiplicador * this.getMultiplicadorXp()));
    }

    getMultiplicadorXp() { return DADOS_MONSTROS[this.tipo].recompensa; }

    getCategoria() { return DADOS_MONSTROS[this.tipo].categoria; }

    // ---------- Sobrescritos de Combatente ----------

    getTitulo() {
        return this.nome + " (Nível " + this.nivel + ")";
    }

    getForteContra() {
        return this.vantagens;
    }

    getFracoContra() {
        return this.fraquezas;
    }

    temFraquezaContra(classe) {
        return this.fraquezas.includes(classe);
    }

    multiplicadorContra(alvo) {
        for (const classe of this.vantagens) {
            if (alvo.ehDaClasse(classe)) {
                return REGRAS.bonusVantagem;
            }
        }
        return 1;
    }

    // Monstro usa a habilidade em 70% das vezes que ela está disponível
    escolherAcao(batalha) {
        if (this.podeUsarHabilidade() && batalha.sorteio.chance(70)) {
            return "habilidade";
        }
        return "atacar";
    }
}


// =====================================================================
// TIPOS DE MONSTRO
// =====================================================================

// Inimigo comum: NÃO tem habilidade especial (igual ao goblin do exemplo do
// professor). Ele não implementa usarHabilidade() e nem precisa: a Batalha
// pergunta temHabilidadeEspecial() antes (Segregação de Interface).
class Goblin extends Monstro {
    constructor(nivel) {
        super("Goblin", nivel);
    }
}

class Ogro extends Monstro {
    constructor(nivel) {
        super("Ogro", nivel);
        this.regeneracao = Math.round(6 * fatorDeNivel(this.nivel)); // HP por turno
        this.habilidade = {
            nome: "Golpe Esmagador",
            descricao: "Ergue o porrete e causa 160% de dano físico.",
            mensagem: "ergue seu porrete com força descomunal",
            custo: 8,
            recarga: 2
        };
    }

    usarHabilidade(alvo, batalha) {
        batalha.golpearComHabilidade(this, alvo, "fisico", 1.6);
    }

    getPassiva() {
        return "regenera " + this.regeneracao + " HP por turno.";
    }

    // Passiva: regenera um pouco de vida no fim de cada turno
    aoFimDoTurno(batalha) {
        const curado = this.curar(this.regeneracao);
        if (curado > 0) {
            batalha.narrar("regeneracao", { ator: this, valor: curado });
        }
    }
}

class Dragao extends Monstro {
    constructor(nivel) {
        super("Dragão", nivel);
        this.habilidade = {
            nome: "Sopro de Fogo",
            descricao: "Dano mágico de 200% e deixa o alvo queimando por 2 turnos.",
            mensagem: "solta um poderoso jato de fogo",
            custo: 20,
            recarga: 3
        };
    }

    usarHabilidade(alvo, batalha) {
        const acertou = batalha.golpearComHabilidade(this, alvo, "magico", 2);
        if (acertou && alvo.estaVivo()) {
            batalha.aplicarEfeito(alvo, new Queimando(this.getStat("magico") * 0.3));
        }
    }
}

class Lich extends Monstro {
    constructor(nivel) {
        super("Lich", nivel);
        this.habilidade = {
            nome: "Raio da Morte",
            descricao: "Dano espiritual (energia profana) de 180% e drena 10% do MP máximo do alvo.",
            mensagem: "invoca um uma coceira mortal no pé, que quebra totalmente sua sanidade",
            custo: 20,
            recarga: 2
        };
    }

    usarHabilidade(alvo, batalha) {
        const acertou = batalha.golpearComHabilidade(this, alvo, "sagrado", 1.8);
        if (acertou && alvo.estaVivo()) {
            const drenado = alvo.gastarMp(alvo.getMpMaximo() * 0.1);
            this.recuperarMp(drenado);
            if (drenado > 0) {
                batalha.narrar("dreno", { ator: this, alvo: alvo, valor: drenado });
            }
        }
    }
}

class Minotauro extends Monstro {
    constructor(nivel) {
        super("Minotauro", nivel);
        this.habilidade = {
            nome: "Investida",
            descricao: "Dano físico de 160% com 30% de chance de atordoar (o alvo perde a vez).",
            mensagem: "prepara uma investida poderosa, bufando furiosamente",
            custo: 10,
            recarga: 3
        };
    }

    usarHabilidade(alvo, batalha) {
        const acertou = batalha.golpearComHabilidade(this, alvo, "fisico", 1.6);
        if (acertou && alvo.estaVivo()) {
            batalha.aplicarEfeito(alvo, new Atordoado(), 30);
        }
    }
}

class Quimera extends Monstro {
    constructor(nivel) {
        super("Quimera", nivel);
        this.habilidade = {
            nome: "Múltiplos Ataques",
            descricao: "Três golpes físicos de 70% cada; pode envenenar.",
            mensagem: "ataca ao mesmo tempo com suas três cabeças",
            custo: 12,
            recarga: 3
        };
    }

    usarHabilidade(alvo, batalha) {
        let acertouAlgum = false;
        for (let golpe = 1; golpe <= 3; golpe++) {
            if (!alvo.estaVivo()) {
                break;
            }
            if (batalha.golpearComHabilidade(this, alvo, "fisico", 0.7)) {
                acertouAlgum = true;
            }
        }
        if (acertouAlgum && alvo.estaVivo()) {
            batalha.aplicarEfeito(alvo, new Envenenado(this.getStat("veneno") * 0.6), 50);
        }
    }
}

class Basilisco extends Monstro {
    constructor(nivel) {
        super("Basilisco", nivel);
        this.habilidade = {
            nome: "Olhar Petrificante",
            descricao: "Dano venenoso de 150% e petrifica: reduz a resistência a veneno em 30% e a esquiva em 50% por 3 rodadas completas após esta.",
            mensagem: "fixa seu olhar petrificante e libera veneno mortal",
            custo: 12,
            recarga: 3
        };
    }

    usarHabilidade(alvo, batalha) {
        const acertou = batalha.golpearComHabilidade(this, alvo, "veneno", 1.5);
        if (acertou && alvo.estaVivo()) {
            batalha.aplicarEfeito(alvo, new Petrificado());
        }
    }
}

class Manticora extends Monstro {
    constructor(nivel) {
        super("Mantícora", nivel);
        this.habilidade = {
            nome: "Ataque Aéreo",
            descricao: "Dano físico de 140% e envenena o alvo.",
            mensagem: "levanta voo e mergulha com a cauda venenosa",
            custo: 10,
            recarga: 2
        };
    }

    usarHabilidade(alvo, batalha) {
        const acertou = batalha.golpearComHabilidade(this, alvo, "fisico", 1.4);
        if (acertou && alvo.estaVivo()) {
            batalha.aplicarEfeito(alvo, new Envenenado(this.getStat("veneno") * 0.6));
        }
    }
}

class Hidra extends Monstro {
    constructor(nivel) {
        super("Hidra", nivel);
        this.habilidade = {
            nome: "Regeneração",
            descricao: "Ataque venenoso de 130% e regenera 15% do HP máximo.",
            mensagem: "regenera as cabeças perdidas enquanto cospe veneno",
            custo: 15,
            recarga: 3
        };
    }

    usarHabilidade(alvo, batalha) {
        batalha.golpearComHabilidade(this, alvo, "veneno", 1.3);
        const curado = this.curar(this.getHpMaximo() * 0.15);
        if (curado > 0) {
            batalha.narrar("cura-propria", { ator: this, valor: curado });
        }
    }
}

class Gargula extends Monstro {
    constructor(nivel) {
        super("Gárgula", nivel);
        this.habilidade = {
            nome: "Forma de Pedra",
            descricao: "Golpe físico de 120% e +50% de defesa física e mágica por 2 turnos.",
            mensagem: "endurece a pele de pedra enquanto ataca",
            custo: 10,
            recarga: 3
        };
    }

    usarHabilidade(alvo, batalha) {
        batalha.aplicarEfeito(this, new FormaDePedra());
        batalha.golpearComHabilidade(this, alvo, "fisico", 1.2);
    }
}


// Liga o nome do monstro à classe certa (mesma ideia de CLASSES_HEROIS)
const CLASSES_MONSTROS = {
    "Goblin": Goblin,
    "Ogro": Ogro,
    "Dragão": Dragao,
    "Lich": Lich,
    "Minotauro": Minotauro,
    "Quimera": Quimera,
    "Basilisco": Basilisco,
    "Mantícora": Manticora,
    "Hidra": Hidra,
    "Gárgula": Gargula
};

function criarMonstro(tipo, nivel) {
    if (!Object.hasOwn(CLASSES_MONSTROS, tipo)) {
        throw new Error("Monstro desconhecido: " + tipo);
    }
    const ClasseDoMonstro = CLASSES_MONSTROS[tipo];
    return new ClasseDoMonstro(nivel);
}
