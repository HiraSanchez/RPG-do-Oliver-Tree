// =====================================================================
// HERÓIS
// Heroi (abstrata) herda de Combatente e cuida do que é comum a todo
// herói: atributos, nível e experiência.
// Cada classe (Guerreiro, Mago...) herda de Heroi e implementa
// a sua própria habilidade especial em usarHabilidade().
// =====================================================================

class Heroi extends Combatente {
    #atributos;
    #xp;
    constructor(nome, classe, atributos, nivel = 1, xp = 0) {
        if (new.target === Heroi) {
            throw new Error("Heroi é uma classe abstrata. Use uma classe, como Guerreiro.");
        }
        if (!Number.isInteger(nivel) || nivel < 1 || nivel > REGRAS.nivelMaximo) throw new RangeError("Nível de herói inválido.");
        if (!atributos || typeof atributos !== "object" || Array.isArray(atributos) ||
            ATRIBUTOS.some(a => !Number.isInteger(atributos[a.id] ?? 0) || (atributos[a.id] ?? 0) < 0 || (atributos[a.id] ?? 0) > REGRAS.maxPorAtributo) ||
            Heroi.totalDePontos(atributos) > REGRAS.pontosAtributo) throw new RangeError("Atributos inválidos.");
        if (!Number.isSafeInteger(xp) || xp < 0 || (nivel === REGRAS.nivelMaximo ? xp !== 0 : xp >= Heroi.xpParaSubir(nivel))) {
            throw new RangeError("XP incompatível com o nível.");
        }
        const dados = DADOS_HEROIS[classe];
        const estatisticas = Heroi.calcularEstatisticas(classe, atributos, nivel);
        super(nome, dados.imagem, nivel, estatisticas, dados.ataqueBasico);

        this.classe = classe;
        this.#atributos = Object.freeze({ ...atributos });
        this.#xp = xp;
    }

    get atributos() { return this.#atributos; }
    get xp() { return this.#xp; }

    // Fórmula: valor base + (atributo x ganho por ponto).
    // MP e resistências preservam seu orçamento; HP, dano e armadura escalam.
    static calcularEstatisticas(classe, atributos, nivel) {
        const formulas = DADOS_HEROIS[classe].formulas;
        const estatisticas = {};

        for (const nome in formulas) {
            const valorBase = formulas[nome][0];
            const ganhos = formulas[nome][1];

            let valor = valorBase;
            for (const atributo in ganhos) {
                let pontos = atributos[atributo];
                if (pontos === undefined) {
                    pontos = 0;
                }
                valor = valor + pontos * ganhos[atributo];
            }

            estatisticas[nome] = escalarEstatistica(nome, valor, nivel);
        }
        return estatisticas;
    }

    static totalDePontos(atributos) {
        let total = 0;
        for (const atributo of ATRIBUTOS) {
            if (atributos[atributo.id] !== undefined) {
                total = total + atributos[atributo.id];
            }
        }
        return total;
    }

    static tiposDeDano(classe) { return DADOS_HEROIS[classe].danosUsados; }

    static ganhosDoAtributo(classe, atributo) {
        return Object.entries(DADOS_HEROIS[classe].formulas)
            .filter(([stat, formula]) => (!Object.hasOwn(TIPOS_DANO, stat) || this.tiposDeDano(classe).includes(stat)) && formula[1][atributo] > 0)
            .map(([stat, formula]) => ({ stat, ganho: formula[1][atributo] }));
    }

    static atributosUteis(classe) {
        return ATRIBUTOS.filter(a => this.ganhosDoAtributo(classe, a.id).length > 0);
    }

    // Devolve a mensagem de erro, ou null se a distribuição está certa
    static validarAtributos(atributos) {
        if (!atributos || typeof atributos !== "object" || Array.isArray(atributos)) {
            return "Atributos inválidos.";
        }
        for (const atributo of ATRIBUTOS) {
            const valor = atributos[atributo.id];
            if (!Number.isInteger(valor) || valor < 0 || valor > REGRAS.maxPorAtributo) {
                return "Cada atributo deve ser um número inteiro entre 0 e " + REGRAS.maxPorAtributo + ".";
            }
        }
        const total = Heroi.totalDePontos(atributos);
        if (total !== REGRAS.pontosAtributo) {
            return "Distribua exatamente " + REGRAS.pontosAtributo + " pontos (usados: " + total + ").";
        }
        return null;
    }

    static xpParaSubir(nivel) {
        return REGRAS.xpBaseNivel * nivel;
    }

    // Recria um herói salvo no navegador. Devolve null se os dados estiverem estragados.
    static carregar(dados) {
        if (!dados || typeof dados.nome !== "string" || !dados.nome.trim() || dados.nome.length > 24 ||
            typeof dados.classe !== "string") {
            return null;
        }
        // Converte somente saves antigos; as opções do jogo usam os nomes atuais.
        const classesAntigas = {
            "Mago Daniel": "Mago",
            "Arqueira Diovana": "Arqueira",
            "Druida Vianey": "Druida"
        };
        const classe = Object.hasOwn(classesAntigas, dados.classe) ? classesAntigas[dados.classe] : dados.classe;
        if (!Object.hasOwn(CLASSES_HEROIS, classe)) return null;
        if (Heroi.validarAtributos(dados.atributos) !== null) {
            return null;
        }
        const nivel = dados.nivel ?? 1;
        const xp = dados.xp ?? 0;
        if (!Number.isInteger(nivel) || nivel < 1 || nivel > REGRAS.nivelMaximo ||
            !Number.isSafeInteger(xp) || xp < 0 ||
            (nivel === REGRAS.nivelMaximo ? xp !== 0 : xp >= Heroi.xpParaSubir(nivel))) return null;
        return criarHeroi(dados.nome.trim(), classe, dados.atributos, nivel, xp);
    }

    // O que vai para o localStorage
    paraSalvar() {
        return {
            nome: this.nome,
            classe: this.classe,
            atributos: this.atributos,
            nivel: this.nivel,
            xp: this.xp
        };
    }

    estaNoNivelMaximo() {
        return this.nivel >= REGRAS.nivelMaximo;
    }

    // Soma XP e sobe quantos níveis der. Devolve quantos níveis subiu.
    ganharXp(quantidade) {
        numeroNaoNegativo(quantidade, "XP");
        if (!Number.isSafeInteger(quantidade)) throw new RangeError("XP deve ser inteiro seguro.");
        if (this.estaNoNivelMaximo()) {
            return 0;
        }

        if (!Number.isSafeInteger(this.#xp + quantidade)) throw new RangeError("XP excedeu o limite.");
        this.#xp += quantidade;
        let niveisGanhos = 0;
        while (this.nivel < REGRAS.nivelMaximo && this.xp >= Heroi.xpParaSubir(this.nivel)) {
            this.#xp -= Heroi.xpParaSubir(this.nivel);
            this.nivel++;
            niveisGanhos++;
        }
        if (this.nivel >= REGRAS.nivelMaximo) {
            this.#xp = 0;
        }

        if (niveisGanhos > 0) {
            this.definirEstatisticas(Heroi.calcularEstatisticas(this.classe, this.atributos, this.nivel));
        }
        return niveisGanhos;
    }

    // Para a barra de XP da ficha. "necessario" = 0 quando está no nível máximo.
    getProgresso() {
        let necessario = 0;
        if (this.nivel < REGRAS.nivelMaximo) {
            necessario = Heroi.xpParaSubir(this.nivel);
        }
        return { nivel: this.nivel, xp: this.xp, necessario: necessario };
    }

    // ---------- Sobrescritos de Combatente ----------

    getTitulo() {
        return this.nome + " — " + this.classe + " · Nível " + this.nivel;
    }

    ehDaClasse(classe) {
        return this.classe === classe;
    }

    // Lido da tabela de monstros, então a ficha nunca contradiz a batalha
    getForteContra() {
        const lista = [];
        for (const tipo in DADOS_MONSTROS) {
            if (DADOS_MONSTROS[tipo].fraquezas.includes(this.classe)) {
                lista.push(tipo);
            }
        }
        return lista;
    }

    getFracoContra() {
        const lista = [];
        for (const tipo in DADOS_MONSTROS) {
            if (DADOS_MONSTROS[tipo].vantagens.includes(this.classe)) {
                lista.push(tipo);
            }
        }
        return lista;
    }

    multiplicadorContra(alvo) {
        if (alvo.temFraquezaContra(this.classe)) {
            return REGRAS.bonusVantagem;
        }
        return 1;
    }

    // Usado na "Batalha automática"
    escolherAcao(batalha) {
        const vidaBaixa = this.getHp() < this.getHpMaximo() * 0.35;
        if (vidaBaixa && batalha.pocoes > 0) {
            return "pocao";
        }
        if (this.podeUsarHabilidade()) {
            return "habilidade";
        }
        return "atacar";
    }
}


// =====================================================================
// CLASSES DE HERÓI
// Cada uma define os dados da sua habilidade no construtor e o que ela
// faz em usarHabilidade(alvo, batalha).
// =====================================================================

class Guerreiro extends Heroi {
    constructor(nome, atributos, nivel, xp) {
        super(nome, "Guerreiro", atributos, nivel, xp);
        this.habilidade = {
            nome: "Golpe Poderoso",
            descricao: "Golpe físico com 180% de dano.",
            mensagem: "concentra toda sua força em um único golpe devastador",
            custo: 10,
            recarga: 2
        };
    }

    usarHabilidade(alvo, batalha) {
        batalha.golpearComHabilidade(this, alvo, "fisico", 1.8);
    }
}

class Mago extends Heroi {
    constructor(nome, atributos, nivel, xp) {
        super(nome, "Mago", atributos, nivel, xp);
        this.habilidade = {
            nome: "Ataque Kuromi",
            descricao: "Dano mágico de 200% e deixa o alvo queimando por 2 turnos.",
            mensagem: "Dispara uma rajada explosiva do Caos, queimando seus inimigos com um fogo infernal",
            custo: 25,
            recarga: 2
        };
    }

    usarHabilidade(alvo, batalha) {
        const acertou = batalha.golpearComHabilidade(this, alvo, "magico", 2);
        if (acertou && alvo.estaVivo()) {
            batalha.aplicarEfeito(alvo, new Queimando(this.getStat("magico") * 0.3));
        }
    }
}

class Arqueira extends Heroi {
    constructor(nome, atributos, nivel, xp) {
        super(nome, "Arqueira", atributos, nivel, xp);
        this.habilidade = {
            nome: "Flecha Venenosa da Rainha Taylor",
            descricao: "Dano físico de 130%, envenena o alvo e dá +25 pontos percentuais de crítico por 3 ações, incluindo esta.",
            mensagem: "prepara uma flecha especial, banhada nas graças de Taylor Swift",
            custo: 15,
            recarga: 3
        };
    }

    usarHabilidade(alvo, batalha) {
        // a mira vem antes, então o bônus de crítico já vale nesta flecha
        batalha.aplicarEfeito(this, new MiraPrecisa());
        const acertou = batalha.golpearComHabilidade(this, alvo, "fisico", 1.3);
        if (acertou && alvo.estaVivo()) {
            batalha.aplicarEfeito(alvo, new Envenenado(this.getStat("veneno") * 0.6));
        }
    }
}

class Paladino extends Heroi {
    constructor(nome, atributos, nivel, xp) {
        super(nome, "Paladino", atributos, nivel, xp);
        this.habilidade = {
            nome: "Golpe Sagrado",
            descricao: "Dano espiritual (luz sagrada) de 180% e cura 8% do HP máximo por 3 turnos.",
            mensagem: "invoca o poder divino, fazendo sua arma brilhar com luz sagrada",
            custo: 25,
            recarga: 3
        };
    }

    usarHabilidade(alvo, batalha) {
        batalha.aplicarEfeito(this, new Bencao(this.getHpMaximo() * 0.08));
        batalha.golpearComHabilidade(this, alvo, "sagrado", 1.8);
    }
}

class Bardo extends Heroi {
    constructor(nome, atributos, nivel, xp) {
        super(nome, "Bardo", atributos, nivel, xp);
        this.habilidade = {
            nome: "Canção de Batalha",
            descricao: "Dano mágico de 140%; recupera 10% do MP máximo no início das próximas 3 ações e ganha +10 pontos percentuais de crítico por 3 ações, incluindo esta.",
            mensagem: "entoa uma melodia mágica que ressoa no ar (Canção Picada Fatal MC Livinho)",
            custo: 20,
            recarga: 3
        };
    }

    usarHabilidade(alvo, batalha) {
        batalha.aplicarEfeito(this, new Inspirado(this.getMpMaximo() * 0.1));
        batalha.golpearComHabilidade(this, alvo, "magico", 1.4);
    }
}

class Ladino extends Heroi {
    constructor(nome, atributos, nivel, xp) {
        super(nome, "Ladino", atributos, nivel, xp);
        this.habilidade = {
            nome: "Golpe Furtivo",
            descricao: "Dano físico de 150% com +30 pontos percentuais de chance de crítico neste golpe; envenena o alvo.",
            mensagem: "Cria uma ilusão que hipnotiza, se move com velocidade sobrenatural e ataca pelas sombras",
            custo: 15,
            recarga: 2
        };
    }

    usarHabilidade(alvo, batalha) {
        const acertou = batalha.golpearComHabilidade(this, alvo, "fisico", 1.5, 30);
        if (acertou && alvo.estaVivo()) {
            batalha.aplicarEfeito(alvo, new Envenenado(this.getStat("veneno") * 0.6));
        }
    }
}

class Druida extends Heroi {
    constructor(nome, atributos, nivel, xp) {
        super(nome, "Druida", atributos, nivel, xp);
        this.habilidade = {
            nome: "Chamado da MY MELODY",
            descricao: "Dano mágico de 150%, envenena o alvo em um loop for e regenera 8% do HP por 3 turnos.",
            mensagem: "invoca as forças primais da natureza, abençoadas pela My Melody",
            custo: 25,
            recarga: 3
        };
    }

    usarHabilidade(alvo, batalha) {
        batalha.aplicarEfeito(this, new Regeneracao(this.getHpMaximo() * 0.08));
        const acertou = batalha.golpearComHabilidade(this, alvo, "magico", 1.5);
        if (acertou && alvo.estaVivo()) {
            batalha.aplicarEfeito(alvo, new Envenenado(this.getStat("veneno") * 0.5));
        }
    }
}

class Barbaro extends Heroi {
    constructor(nome, atributos, nivel, xp) {
        super(nome, "Bárbaro", atributos, nivel, xp);
        this.habilidade = {
            nome: "Fúria Berserker",
            descricao: "Dano físico de 200% e entra em fúria (+30% de defesa, +10 pontos percentuais de crítico) por 3 ações, incluindo esta.",
            mensagem: "entra em fúria berserker, os olhos brilhando de ódio",
            custo: 8,
            recarga: 3
        };
    }

    usarHabilidade(alvo, batalha) {
        batalha.aplicarEfeito(this, new Furia());
        batalha.golpearComHabilidade(this, alvo, "fisico", 2);
    }
}


// Liga o nome que aparece na tela à classe certa.
// Para criar uma classe nova: escreva a classe acima, coloque os números
// em dados.js e adicione uma linha aqui. Nada mais precisa mudar.
const CLASSES_HEROIS = {
    "Guerreiro": Guerreiro,
    "Mago": Mago,
    "Arqueira": Arqueira,
    "Paladino": Paladino,
    "Bardo": Bardo,
    "Ladino": Ladino,
    "Druida": Druida,
    "Bárbaro": Barbaro
};

function criarHeroi(nome, classe, atributos, nivel = 1, xp = 0) {
    if (!Object.hasOwn(CLASSES_HEROIS, classe)) {
        throw new Error("Classe inválida: " + classe);
    }
    const ClasseDoHeroi = CLASSES_HEROIS[classe];
    return new ClasseDoHeroi(nome, atributos, nivel, xp);
}
