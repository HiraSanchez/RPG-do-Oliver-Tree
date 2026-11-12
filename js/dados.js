// =====================================================================
// DADOS DO JOGO
// Aqui ficam só os NÚMEROS (vida, dano, defesas...). O comportamento
// (habilidades, efeitos, turnos) fica nas classes. Para balancear o
// jogo, basta mexer neste arquivo.
// =====================================================================

const REGRAS = {
    pontosAtributo: 30,
    maxPorAtributo: 10,
    constanteDefesa: 50,       // redução = defesa / (defesa + 50) -> nunca chega a 100%
    resistenciaMaxima: 75,     // % máxima de resistência a veneno/sagrado
    esquivaMaxima: 50,         // % máxima de esquiva
    criticoMaximo: 75,         // % máxima de crítico
    multiplicadorCritico: 1.75,
    bonusVantagem: 1.25,       // dano extra contra quem é fraco à sua classe/tipo
    variacaoDano: 0.1,         // cada golpe varia 10% para mais ou para menos
    regeneracaoMp: 0.05,       // 5% do MP máximo no fim de cada turno (mínimo 2)
    pocoesPorBatalha: 3,
    curaPocao: 0.35,           // 35% do HP máximo
    reducaoDefendendo: 0.5,    // todos os golpes diretos até a próxima ação
    mpAoDefender: 0.15,        // e recupera 15% do MP
    limiteTurnos: 50,          // depois disso a batalha termina empatada

    // Força geral dos monstros (1 = valores da tabela DADOS_MONSTROS).
    // Regras em docs/regras.md; novas simulações em scripts/simular.cjs.
    vidaMonstros: 1.6,
    danoMonstros: 1.15,

    // Níveis e experiência
    nivelMaximo: 20,
    crescimentoPorNivel: 1.1,  // HP, dano e armaduras; MP e resistências não escalam
    bonusPorcentagemNivel: 0.25, // pontos percentuais de crítico/esquiva por nível
    xpPorNivelMonstro: 35,     // XP base por nível do monstro derrotado
    xpBaseNivel: 100           // XP para subir do nível N para o N+1 = 100 x N
};

// Nível 1 = 1x, nível 2 = 1,1x, nível 3 = 1,21x, nível 10 = 2,4x...
function fatorDeNivel(nivel) {
    return Math.pow(REGRAS.crescimentoPorNivel, nivel - 1);
}

function escalarEstatistica(nome, valor, nivel) {
    // Recursos e resistências preservam a economia e as fraquezas da classe.
    if (nome === "mp" || nome === "resVeneno" || nome === "resSagrado") {
        return Math.round(valor);
    }
    if (nome === "critico" || nome === "esquiva") {
        return Math.round(valor) + REGRAS.bonusPorcentagemNivel * (nivel - 1);
    }
    return Math.round(Math.round(valor) * fatorDeNivel(nivel));
}

function limiteEstatistica(nome) {
    if (nome === "resVeneno" || nome === "resSagrado") return REGRAS.resistenciaMaxima;
    if (nome === "critico") return REGRAS.criticoMaximo;
    if (nome === "esquiva") return REGRAS.esquivaMaxima;
    return Infinity;
}

const ATRIBUTOS = [
    { id: "forca", nome: "Força", descricao: "Dano físico, HP e defesa" },
    { id: "destreza", nome: "Destreza", descricao: "Crítico, esquiva e arcos" },
    { id: "inteligencia", nome: "Inteligência", descricao: "Magia, MP e venenos" },
    { id: "constituicao", nome: "Constituição", descricao: "HP e resistências" },
    { id: "sabedoria", nome: "Sabedoria", descricao: "Defesa mágica e poder sagrado" },
    { id: "carisma", nome: "Carisma", descricao: "Magia e MP do Bardo" }
];

// Nome que aparece na tela para cada estatística de combate
const ESTATISTICAS = {
    hp: "HP",
    mp: "MP",
    fisico: "Físico",
    magico: "Mágico",
    veneno: "Veneno",
    sagrado: "Espiritual",
    defesa: "Física",
    defesaMagica: "Mágica",
    resVeneno: "Veneno",
    resSagrado: "Espiritual",
    critico: "Crítico",
    esquiva: "Esquiva"
};

// Como cada tipo de dano é reduzido:
// - físico e mágico: pela defesa correspondente;
// - veneno e espiritual: ignoram armadura, mas sofrem a resistência (%) do alvo.
// "Espiritual" é a energia da alma: a luz sagrada do Paladino e a energia profana do Lich.
const TIPOS_DANO = {
    fisico: { nome: "físico", defesa: "defesa" },
    magico: { nome: "mágico", defesa: "defesaMagica" },
    veneno: { nome: "venenoso", resistencia: "resVeneno" },
    sagrado: { nome: "espiritual", resistencia: "resSagrado" }
};


// ---------------------------------------------------------------------
// HERÓIS
// formulas -> estatística: [valor base, { atributo: quanto ganha por ponto }]
// A habilidade especial de cada classe fica na própria classe (herois.js).
// ---------------------------------------------------------------------
const DADOS_HEROIS = {
    "Guerreiro": {
        imagem: "Imagens/guerreiro.png",
        descricao: "Linha de frente: muito HP e defesa, dano físico consistente.",
        ataqueBasico: "fisico",
        danosUsados: ["fisico"],
        formulas: {
            hp: [90, { forca: 3, constituicao: 2 }],
            mp: [30, { inteligencia: 0.5 }],
            fisico: [15, { forca: 1.2 }],
            magico: [0, { inteligencia: 0.3 }],
            defesa: [15, { forca: 0.8, constituicao: 0.6 }],
            defesaMagica: [8, { sabedoria: 0.4 }],
            resVeneno: [5, { constituicao: 0.4 }],
            resSagrado: [5, { sabedoria: 0.3 }],
            critico: [5, { destreza: 0.4 }],
            esquiva: [5, { destreza: 0.3 }]
        }
    },
    "Mago": {
        imagem: "Imagens/ladino.png",
        descricao: "Rainha das Bruxas, suas habilidades são tão excepcionais quanto sua beleza",
        ataqueBasico: "magico",
        danosUsados: ["magico"],
        formulas: {
            hp: [85, { constituicao: 2 }],
            mp: [100, { inteligencia: 2.5, sabedoria: 1.5 }],
            fisico: [5, { forca: 0.3 }],
            magico: [20, { inteligencia: 1.2, sabedoria: 0.8 }],
            defesa: [5, { constituicao: 0.3 }],
            defesaMagica: [15, { inteligencia: 0.8, sabedoria: 0.6 }],
            resVeneno: [3, { constituicao: 0.2 }],
            resSagrado: [8, { sabedoria: 0.5 }],
            critico: [3, { inteligencia: 0.2 }],
            esquiva: [3, { destreza: 0.2 }]
        }
    },
    "Arqueira": {
        imagem: "Imagens/dih.png",
        descricao: "Linda, maravilhosa, ágil e precisa: muito crítico e esquiva.",
        ataqueBasico: "fisico",
        danosUsados: ["fisico", "veneno"],
        formulas: {
            hp: [105, { constituicao: 2 }],
            mp: [40, { inteligencia: 0.8 }],
            fisico: [14, { destreza: 1.4 }],
            magico: [8, { inteligencia: 0.5 }],
            veneno: [6, { destreza: 0.6 }],
            defesa: [8, { destreza: 0.5 }],
            defesaMagica: [8, { sabedoria: 0.4 }],
            resVeneno: [4, { constituicao: 0.3 }],
            resSagrado: [6, { sabedoria: 0.3 }],
            critico: [10, { destreza: 0.6 }],
            esquiva: [10, { destreza: 0.5 }]
        }
    },
    "Paladino": {
        imagem: "Imagens/paladino.png",
        descricao: "Guerreiro sagrado: resistente e capaz de se curar.",
        ataqueBasico: "fisico",
        danosUsados: ["fisico", "sagrado"],
        formulas: {
            hp: [85, { forca: 2, constituicao: 1.8 }],
            mp: [70, { sabedoria: 1.5 }],
            fisico: [10, { forca: 0.8 }],
            magico: [8, { sabedoria: 0.7 }],
            sagrado: [12, { sabedoria: 1 }],
            defesa: [12, { forca: 0.6, constituicao: 0.6 }],
            defesaMagica: [12, { sabedoria: 0.8 }],
            resVeneno: [8, { constituicao: 0.4 }],
            resSagrado: [15, { sabedoria: 1 }],
            critico: [5, { forca: 0.3 }],
            esquiva: [5, { destreza: 0.3 }]
        }
    },
    "Bardo": {
        imagem: "Imagens/bardo.png",
        descricao: "O criador do RPG, infelizmente só sobrou essa classe pra mim, mas não significa que é pouca coisa. Usa o carisma como arma: magia constante e MP quase infinito.",
        ataqueBasico: "magico",
        danosUsados: ["magico"],
        formulas: {
            hp: [110, { constituicao: 2 }],
            mp: [80, { carisma: 2 }],
            fisico: [8, { destreza: 0.7 }],
            magico: [18, { carisma: 1.5 }],
            defesa: [8, { destreza: 0.4 }],
            defesaMagica: [10, { carisma: 0.6 }],
            resVeneno: [6, { constituicao: 0.3 }],
            resSagrado: [8, { carisma: 0.4 }],
            critico: [8, { destreza: 0.4 }],
            esquiva: [8, { destreza: 0.4 }]
        }
    },
    "Ladino": {
        imagem: "Imagens/Eterno_Amor.png",
        descricao: "Lorena, princesa amada pelo coração do criador deste RPG. Infelizmente, acabei perdendo-a por falhas minhas, mas decidi eternizá-la neste jogo para nunca me esquecer do quanto ela foi especial para mim.",
        ataqueBasico: "fisico",
        danosUsados: ["fisico", "veneno"],
        formulas: {
            hp: [90, { constituicao: 2 }],
            mp: [40, { inteligencia: 0.8 }],
            fisico: [12, { destreza: 1.2 }],
            veneno: [8, { inteligencia: 0.8 }],
            defesa: [8, { destreza: 0.5 }],
            defesaMagica: [8, { inteligencia: 0.4 }],
            resVeneno: [10, { constituicao: 0.5 }],
            resSagrado: [5, { sabedoria: 0.3 }],
            critico: [15, { destreza: 1 }],
            esquiva: [15, { destreza: 0.8 }]
        }
    },
    "Druida": {
        imagem: "Imagens/druida.png",
        descricao: "Manu, pequena e simpática, protetora da natureza e amiga do criador deste RPG.",
        ataqueBasico: "magico",
        danosUsados: ["magico", "veneno"],
        formulas: {
            hp: [85, { constituicao: 2 }],
            mp: [90, { sabedoria: 2 }],
            fisico: [8, { forca: 0.5 }],
            magico: [12, { sabedoria: 0.8 }],
            veneno: [10, { sabedoria: 0.6 }],
            defesa: [10, { constituicao: 0.5 }],
            defesaMagica: [12, { sabedoria: 0.6 }],
            resVeneno: [12, { constituicao: 0.6 }],
            resSagrado: [10, { sabedoria: 0.5 }],
            critico: [5, { sabedoria: 0.3 }],
            esquiva: [8, { destreza: 0.4 }]
        }
    },
    "Bárbaro": {
        imagem: "Imagens/barbaro.png",
        descricao: "Força bruta: o maior HP e uma habilidade física devastadora, pouca magia.",
        ataqueBasico: "fisico",
        danosUsados: ["fisico"],
        formulas: {
            hp: [110, { forca: 2.5, constituicao: 2 }],
            mp: [20, { inteligencia: 0.3 }],
            fisico: [15, { forca: 1.1 }],
            magico: [0, { inteligencia: 0.3 }],
            defesa: [6, { forca: 0.4, constituicao: 0.4 }],
            defesaMagica: [5, { constituicao: 0.3 }],
            resVeneno: [8, { constituicao: 0.4 }],
            resSagrado: [5, { sabedoria: 0.3 }],
            critico: [8, { forca: 0.4 }],
            esquiva: [5, { destreza: 0.3 }]
        }
    }
};

// Distribuição de pontos do botão "Recomendado para a classe".
// Ideia: o atributo principal da classe vai no máximo (10), Constituição
// também (sobreviver importa para todos) e o resto vai nos atributos
// secundários que a classe usa. Nenhum ponto vai para atributo que a classe não usa.
const DISTRIBUICAO_RECOMENDADA = {
    "Guerreiro": {
        pontos: { forca: 10, destreza: 6, inteligencia: 0, constituicao: 10, sabedoria: 4, carisma: 0 },
        motivo: "Força e Constituição no máximo: mais HP, dano e defesa. Destreza para crítico e esquiva, e Sabedoria para aguentar magia."
    },
    "Mago": {
        pontos: { forca: 0, destreza: 4, inteligencia: 10, constituicao: 6, sabedoria: 10, carisma: 0 },
        motivo: "Inteligência e Sabedoria no máximo: as duas aumentam o dano mágico e o MP. Constituição compensa o HP baixo."
    },
    "Arqueira": {
        pontos: { forca: 0, destreza: 10, inteligencia: 4, constituicao: 10, sabedoria: 6, carisma: 0 },
        motivo: "Destreza no máximo: dano, crítico, esquiva e veneno das flechas. Constituição para HP e Sabedoria para defesa mágica."
    },
    "Paladino": {
        pontos: { forca: 8, destreza: 2, inteligencia: 0, constituicao: 10, sabedoria: 10, carisma: 0 },
        motivo: "Sabedoria no máximo para o poder sagrado e MP; Constituição e Força para ser um tanque resistente."
    },
    "Bardo": {
        pontos: { forca: 0, destreza: 10, inteligencia: 0, constituicao: 10, sabedoria: 0, carisma: 10 },
        motivo: "Carisma no máximo: é dele que vêm a magia e o MP do Bardo. Destreza no máximo para crítico e esquiva."
    },
    "Ladino": {
        pontos: { forca: 0, destreza: 10, inteligencia: 8, constituicao: 10, sabedoria: 2, carisma: 0 },
        motivo: "Destreza no máximo para dano, crítico e esquiva; Inteligência deixa o veneno mais forte."
    },
    "Druida": {
        pontos: { forca: 0, destreza: 10, inteligencia: 0, constituicao: 10, sabedoria: 10, carisma: 0 },
        motivo: "Sabedoria no máximo: magia, veneno e MP do Druida vêm dela. Constituição para HP e resistência a veneno, Destreza para esquiva."
    },
    "Bárbaro": {
        pontos: { forca: 10, destreza: 4, inteligencia: 2, constituicao: 10, sabedoria: 4, carisma: 0 },
        motivo: "Força e Constituição no máximo: muito HP e golpes fortes. Inteligência aumenta o pequeno orçamento de MP."
    }
};


// ---------------------------------------------------------------------
// MONSTROS (valores do nível 1; o nível multiplica pelo fatorDeNivel)
// fraquezas: classes que têm vantagem contra o monstro
// vantagens: classes contra as quais o monstro tem vantagem
// A habilidade de cada monstro fica na própria classe (monstros.js).
// ---------------------------------------------------------------------
const DADOS_MONSTROS = {
    "Goblin": {
        categoria: "Comum", recompensa: 0.45,
        imagem: "Imagens/goblin.png",
        ataqueBasico: "fisico",
        estatisticas: { hp: 110, mp: 0, fisico: 14, defesa: 5, defesaMagica: 5, resVeneno: 3, resSagrado: 3, critico: 10, esquiva: 12 },
        fraquezas: ["Guerreiro", "Bárbaro"],          // força bruta esmaga o baixinho
        vantagens: ["Mago", "Bardo"]           // frágeis quando pegos de perto
    },
    "Ogro": {
        categoria: "Elite", recompensa: 1.1,
        imagem: "Imagens/ogro.png",
        ataqueBasico: "fisico",
        estatisticas: { hp: 160, mp: 10, fisico: 19, defesa: 12, defesaMagica: 5, resVeneno: 8, resSagrado: 5, critico: 5, esquiva: 3 },
        fraquezas: ["Mago", "Arqueira"], // lento contra ataques à distância
        vantagens: ["Guerreiro", "Bárbaro"]           // ganha no corpo a corpo
    },
    "Dragão": {
        categoria: "Chefe", recompensa: 1.6,
        imagem: "Imagens/dragao.jpg",
        ataqueBasico: "fisico",
        estatisticas: { hp: 185, mp: 40, fisico: 18, magico: 16, defesa: 15, defesaMagica: 12, resVeneno: 10, resSagrado: 8, critico: 12, esquiva: 6 },
        fraquezas: ["Paladino", "Arqueira"],  // luz sagrada e flechas nas asas
        vantagens: ["Druida", "Bárbaro"]       // fogo queima a natureza; bárbaro não aguenta magia
    },
    "Lich": {
        categoria: "Chefe", recompensa: 1.3,
        imagem: "Imagens/lich.png",
        ataqueBasico: "magico",
        estatisticas: { hp: 120, mp: 60, fisico: 6, magico: 21, sagrado: 21, defesa: 8, defesaMagica: 15, resVeneno: 12, resSagrado: 5, critico: 8, esquiva: 5 },
        fraquezas: ["Paladino", "Bárbaro"],           // luz sagrada e força bruta contra o morto-vivo
        vantagens: ["Mago", "Bardo"]           // ganha no duelo de magia
    },
    "Minotauro": {
        categoria: "Elite", recompensa: 1.2,
        imagem: "Imagens/minotauro.jpg",
        ataqueBasico: "fisico",
        estatisticas: { hp: 180, mp: 20, fisico: 18, defesa: 15, defesaMagica: 8, resVeneno: 10, resSagrado: 8, critico: 8, esquiva: 5 },
        fraquezas: ["Mago", "Druida"],  // pouca defesa mágica
        vantagens: ["Guerreiro", "Bárbaro"]           // ninguém aguenta a investida de frente
    },
    "Quimera": {
        categoria: "Elite", recompensa: 1.2,
        imagem: "Imagens/quimera.png",
        ataqueBasico: "fisico",
        estatisticas: { hp: 140, mp: 30, fisico: 17, veneno: 9, defesa: 10, defesaMagica: 10, resVeneno: 15, resSagrado: 8, critico: 10, esquiva: 8 },
        fraquezas: ["Ladino", "Bardo"],               // ataque pelas costas; música confunde as três cabeças
        vantagens: ["Arqueira", "Druida"]
    },
    "Basilisco": {
        categoria: "Elite", recompensa: 1.3,
        imagem: "Imagens/basilisco.jpg",
        ataqueBasico: "veneno",
        estatisticas: { hp: 160, mp: 25, fisico: 12, veneno: 18, defesa: 12, defesaMagica: 12, resVeneno: 20, resSagrado: 5, critico: 10, esquiva: 8 },
        fraquezas: ["Druida", "Ladino"],       // druida resiste a veneno; ladino ataca sem olhar nos olhos
        vantagens: ["Paladino", "Bardo"]              // o olhar petrifica quem luta de frente
    },
    "Mantícora": {
        categoria: "Elite", recompensa: 1.1,
        imagem: "Imagens/manticora.png",
        ataqueBasico: "fisico",
        estatisticas: { hp: 150, mp: 20, fisico: 16, veneno: 12, defesa: 10, defesaMagica: 8, resVeneno: 12, resSagrado: 5, critico: 12, esquiva: 10 },
        fraquezas: ["Arqueira", "Bardo"],     // flechas pegam em pleno voo
        vantagens: ["Ladino", "Paladino"]             // ataca de cima, onde a lâmina não alcança
    },
    "Hidra": {
        categoria: "Chefe", recompensa: 1.3,
        imagem: "Imagens/hidra.png",
        ataqueBasico: "veneno",
        estatisticas: { hp: 180, mp: 30, fisico: 14, veneno: 14, defesa: 12, defesaMagica: 10, resVeneno: 20, resSagrado: 8, critico: 5, esquiva: 5 },
        fraquezas: ["Mago", "Guerreiro"],      // fogo cauteriza; espada corta as cabeças
        vantagens: ["Arqueira", "Ladino"]     // flechas e adagas não dão conta de tantas cabeças
    },
    "Gárgula": {
        categoria: "Elite", recompensa: 1.2,
        imagem: "Imagens/gargula.jpg",
        ataqueBasico: "fisico",
        estatisticas: { hp: 170, mp: 25, fisico: 20, defesa: 12, defesaMagica: 12, resVeneno: 8, resSagrado: 12, critico: 8, esquiva: 8 },
        fraquezas: ["Bardo", "Bárbaro"],              // som racha a pedra; marretada também
        vantagens: ["Mago", "Arqueira"] // pele de pedra rebate flechas e feitiços
    }
};
