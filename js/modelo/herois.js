// =====================================================================
// HERÓIS
// Heroi (abstrata) herda de Combatente e cuida do que é comum a todo
// herói: atributos, nível e experiência.
// Cada classe (Guerreiro, Mago Daniel...) herda de Heroi e implementa
// a sua própria habilidade especial em usarHabilidade().
// =====================================================================

class Heroi extends Combatente {
    constructor(nome, classe, atributos, nivel = 1, xp = 0) {
        if (new.target === Heroi) {
            throw new Error("Heroi é uma classe abstrata. Use uma classe, como Guerreiro.");
        }
        const dados = DADOS_HEROIS[classe];
        const estatisticas = Heroi.calcularEstatisticas(classe, atributos, nivel);
        super(nome, dados.imagem, nivel, estatisticas, dados.ataqueBasico);

        this.classe = classe;
        this.atributos = Object.assign({}, atributos); // cópia
        this.xp = xp;
    }

    // Fórmula: valor base + (atributo x ganho por ponto).
    // Depois o nível multiplica HP, MP, dano e defesas.
    // Crítico e esquiva são porcentagens, então só ganham +1 por nível.
    static calcularEstatisticas(classe, atributos, nivel) {
        const formulas = DADOS_HEROIS[classe].formulas;
        const fator = fatorDeNivel(nivel);
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

            if (nome === "critico" || nome === "esquiva") {
                estatisticas[nome] = Math.round(valor + REGRAS.bonusPorcentagemNivel * (nivel - 1));
            } else {
                estatisticas[nome] = Math.round(valor * fator);
            }
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

    // Devolve a mensagem de erro, ou null se a distribuição está certa
    static validarAtributos(atributos) {
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
        if (!dados || !dados.nome || !CLASSES_HEROIS[dados.classe] || !dados.atributos) {
            return null;
        }
        if (Heroi.validarAtributos(dados.atributos) !== null) {
            return null;
        }
        const nivel = limitar(parseInt(dados.nivel) || 1, 1, REGRAS.nivelMaximo);
        const xp = Math.max(0, parseInt(dados.xp) || 0);
        return criarHeroi(dados.nome, dados.classe, dados.atributos, nivel, xp);
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
        if (this.estaNoNivelMaximo()) {
            return 0;
        }

        this.xp = this.xp + quantidade;
        let niveisGanhos = 0;
        while (this.nivel < REGRAS.nivelMaximo && this.xp >= Heroi.xpParaSubir(this.nivel)) {
            this.xp = this.xp - Heroi.xpParaSubir(this.nivel);
            this.nivel++;
            niveisGanhos++;
        }
        if (this.nivel >= REGRAS.nivelMaximo) {
            this.xp = 0;
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

class MagoDaniel extends Heroi {
    constructor(nome, atributos, nivel, xp) {
        super(nome, "Mago Daniel", atributos, nivel, xp);
        this.habilidade = {
            nome: "Ataque Banco Master",
            descricao: "Dano mágico de 200% e deixa o alvo queimando por 2 turnos.",
            mensagem: "invoca o Daniel Vorcaro e lança uma bola de fogo que tira toda sua aposentadoria",
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

class ArqueiraDiovana extends Heroi {
    constructor(nome, atributos, nivel, xp) {
        super(nome, "Arqueira Diovana", atributos, nivel, xp);
        this.habilidade = {
            nome: "Flecha Venenosa da Rainha Taylor",
            descricao: "Dano físico de 130%, envenena o alvo e dá +25% de crítico por 3 turnos.",
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
            descricao: "Dano mágico de 140%; recupera 10% do MP e ganha +10% de crítico por 3 turnos.",
            mensagem: "entoa uma melodia mágica que ressoa no ar",
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
            descricao: "Dano físico de 150% com +30% de chance de crítico; envenena o alvo.",
            mensagem: "se move com velocidade sobrenatural e ataca pelas sombras",
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

class DruidaVianey extends Heroi {
    constructor(nome, atributos, nivel, xp) {
        super(nome, "Druida Vianey", atributos, nivel, xp);
        this.habilidade = {
            nome: "Chamado da Oracle",
            descricao: "Dano mágico de 150%, envenena o alvo em um loop for e regenera 8% do HP por 3 turnos.",
            mensagem: "invoca as forças primais da natureza, abençoadas pela Oracle",
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
            descricao: "Dano físico de 200% e entra em fúria (+30% de defesa, +10% de crítico) por 3 turnos.",
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
    "Mago Daniel": MagoDaniel,
    "Arqueira Diovana": ArqueiraDiovana,
    "Paladino": Paladino,
    "Bardo": Bardo,
    "Ladino": Ladino,
    "Druida Vianey": DruidaVianey,
    "Bárbaro": Barbaro
};

function criarHeroi(nome, classe, atributos, nivel = 1, xp = 0) {
    const ClasseDoHeroi = CLASSES_HEROIS[classe];
    if (ClasseDoHeroi === undefined) {
        throw new Error("Classe inválida: " + classe);
    }
    return new ClasseDoHeroi(nome, atributos, nivel, xp);
}
