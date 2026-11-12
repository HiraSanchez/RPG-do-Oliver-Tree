// =====================================================================
// TESTES - conferem as regras do jogo sem precisar jogar.
// Abra testes.html: cada linha verde é um teste que passou.
//
// Aqui aparece na prática a Inversão de Dependência: como a Batalha
// recebe o Sorteio e o Narrador prontos, os testes entregam versões
// próprias (um sorteio sem sorte e uma saída que guarda o log numa lista).
// =====================================================================

// Sorteio "viciado": sempre devolve o mesmo número.
// Com 0.5: ninguém esquiva (a esquiva máxima é 50%), quase nunca tem
// crítico e o dano não varia. Assim dá para saber o resultado exato.
class SorteioFixo extends Sorteio {
    constructor(valor) {
        super();
        this.valor = valor;
    }

    numero() {
        return this.valor;
    }
}

// Outra "saída" do narrador: guarda as mensagens em uma lista
class SaidaEmLista {
    constructor() {
        this.linhas = [];
    }

    escrever(chave, texto) {
        this.linhas.push({ chave: chave, texto: texto });
    }
}

const resultados = [];

function teste(descricao, funcao) {
    try {
        const passou = funcao();
        resultados.push({ descricao: descricao, passou: passou === true, erro: "" });
    } catch (erro) {
        resultados.push({ descricao: descricao, passou: false, erro: erro.message });
    }
}

function lancaErro(funcao) {
    try {
        funcao();
        return false;
    } catch (erro) {
        return true;
    }
}

function novoHeroi(classe, nivel = 1) {
    return criarHeroi("Teste", classe, DISTRIBUICAO_RECOMENDADA[classe].pontos, nivel);
}

function novaBatalha(heroi, monstro, sorteio = new SorteioFixo(0.5)) {
    const narrador = new Narrador(new MensagensPtBr(), new SaidaEmLista());
    return criarBatalha(heroi, monstro, narrador, sorteio);
}


// ---------- POO ----------

teste("Classes abstratas não podem ser criadas (Combatente, Heroi, Monstro, Efeito, Acao)", function () {
    return lancaErro(() => new Combatente("x", "", 1, {}, "fisico")) &&
        lancaErro(() => new Heroi("x", "Guerreiro", {})) &&
        lancaErro(() => new Monstro("Goblin")) &&
        lancaErro(() => new Efeito("x", "x", 1, "buff")) &&
        lancaErro(() => new Acao());
});

teste("Herança: um Guerreiro também é um Heroi e um Combatente", function () {
    const guerreiro = novoHeroi("Guerreiro");
    return guerreiro instanceof Guerreiro && guerreiro instanceof Heroi && guerreiro instanceof Combatente;
});

teste("Encapsulamento: HP, MP, base e recarga não podem ser acessados por fora", function () {
    const heroi = novoHeroi("Paladino");
    return heroi.hp === undefined && heroi.mp === undefined && heroi.base === undefined &&
        heroi.recarga === undefined && heroi.getHp() === heroi.getHpMaximo();
});

teste("Polimorfismo: cada classe tem a sua própria habilidade", function () {
    const casos = [
        ["Mago", "monstro", "queimando"], ["Arqueira", "heroi", "miraPrecisa"],
        ["Paladino", "heroi", "bencao"], ["Bardo", "heroi", "inspirado"],
        ["Ladino", "monstro", "envenenado"], ["Druida", "heroi", "regeneracao"],
        ["Bárbaro", "heroi", "furia"]
    ];
    for (const [classe, lado, efeito] of casos) {
        const b = novaBatalha(novoHeroi(classe), criarMonstro("Ogro", 10));
        b.agir(b.heroi, b.monstro, "habilidade");
        if (!b[lado].temEfeito(efeito) || b.monstro.getHp() === b.monstro.getHpMaximo()) return false;
    }
    return true;
});


// ---------- SOLID ----------

teste("ISP: o Goblin não tem habilidade especial e a ação vira ataque básico", function () {
    const goblin = criarMonstro("Goblin", 1);
    const batalha = novaBatalha(novoHeroi("Guerreiro"), goblin);
    const hpAntes = batalha.heroi.getHp();
    batalha.agir(goblin, batalha.heroi, "habilidade");
    return !temHabilidadeEspecial(goblin) && batalha.heroi.getHp() < hpAntes;
});

teste("LSP: qualquer herói luta contra qualquer monstro até o fim, sem erro", function () {
    for (const classe in CLASSES_HEROIS) {
        for (const tipo in CLASSES_MONSTROS) {
            const batalha = novaBatalha(novoHeroi(classe), criarMonstro(tipo, 1), new Sorteio());
            batalha.simular();
            if (!["vitoria", "derrota", "empate"].includes(batalha.resultado)) {
                return false;
            }
        }
    }
    return true;
});

teste("DIP: a Batalha escreve no narrador que recebeu (a primeira linha é o início)", function () {
    const saida = new SaidaEmLista();
    criarBatalha(novoHeroi("Bardo"), criarMonstro("Ogro", 1), new Narrador(new MensagensPtBr(), saida), new Sorteio());
    return saida.linhas[0].chave === "inicio" && saida.linhas[0].texto.includes("enfrenta Ogro");
});


// ---------- Regras da batalha ----------

teste("Dano físico segue a fórmula: dano x vantagem x (1 - defesa / (defesa + 50))", function () {
    const guerreiro = novoHeroi("Guerreiro");
    const goblin = criarMonstro("Goblin", 1); // Goblin é fraco contra Guerreiro (+25%)
    const batalha = novaBatalha(guerreiro, goblin);
    const defesa = goblin.getStat("defesa");
    const esperado = Math.round(guerreiro.getStat("fisico") * REGRAS.bonusVantagem * (1 - defesa / (defesa + REGRAS.constanteDefesa)));
    batalha.golpear(guerreiro, goblin, "fisico", 1);
    return goblin.getHpMaximo() - goblin.getHp() === esperado;
});

teste("Defender reduz o dano recebido pela metade", function () {
    function danoRecebido(defendendo) {
        const heroi = novoHeroi("Bardo");
        const ogro = criarMonstro("Ogro", 1);
        const batalha = novaBatalha(heroi, ogro);
        if (defendendo) {
            heroi.adicionarEfeito(new Defendendo());
        }
        batalha.golpear(ogro, heroi, "fisico", 1);
        return heroi.getHpMaximo() - heroi.getHp();
    }
    const normal = danoRecebido(false);
    return Math.abs(danoRecebido(true) - normal * REGRAS.reducaoDefendendo) <= 1;
});

teste("Veneno tira vida no começo do turno de quem está envenenado", function () {
    const ogro = criarMonstro("Ogro", 1);
    const batalha = novaBatalha(novoHeroi("Ladino"), ogro);
    ogro.adicionarEfeito(new Envenenado(10));
    const hpAntes = ogro.getHp();
    batalha.iniciarTurnoDe(ogro);
    return hpAntes - ogro.getHp() === 10;
});

teste("Fúria aumenta a defesa em 30% e some depois de 3 turnos", function () {
    const barbaro = novoHeroi("Bárbaro");
    const batalha = novaBatalha(barbaro, criarMonstro("Goblin", 1));
    const defesa = barbaro.getStat("defesa");
    barbaro.adicionarEfeito(new Furia());
    const comFuria = barbaro.getStat("defesa");
    for (let i = 0; i < 3; i++) {
        batalha.iniciarTurnoDe(barbaro);
    }
    return Math.abs(comFuria - defesa * 1.3) < 0.01 && !barbaro.temEfeito("furia");
});

teste("Habilidade gasta MP e entra em recarga", function () {
    const mago = novoHeroi("Mago");
    const batalha = novaBatalha(mago, criarMonstro("Ogro", 1));
    const mpAntes = mago.getMp();
    batalha.agir(mago, batalha.monstro, "habilidade");
    return mago.getMp() < mpAntes && mago.getRecarga() > 0 && !mago.podeUsarHabilidade();
});


// ---------- Nível, XP e salvamento ----------

teste("100 de XP no nível 1 sobe para o nível 2 e aumenta o HP", function () {
    const heroi = novoHeroi("Guerreiro");
    const hpAntes = heroi.getHpMaximo();
    return heroi.ganharXp(100) === 1 && heroi.nivel === 2 && heroi.getHpMaximo() > hpAntes;
});

teste("No nível máximo a vitória não dá XP", function () {
    const heroi = novoHeroi("Guerreiro", REGRAS.nivelMaximo);
    const batalha = novaBatalha(heroi, criarMonstro("Goblin", 1));
    batalha.simular();
    return batalha.resultado === "vitoria" && batalha.recompensaXp === 0 && heroi.xp === 0;
});

teste("Herói e monstro salvos são carregados iguais", function () {
    const heroi = novoHeroi("Druida", 7);
    heroi.ganharXp(50);
    const heroiCarregado = Heroi.carregar(JSON.parse(JSON.stringify(heroi.paraSalvar())));
    const monstroCarregado = Monstro.carregar({ tipo: "Hidra", nivel: 4 });
    return heroiCarregado instanceof Druida && heroiCarregado.nivel === 7 && heroiCarregado.xp === heroi.xp &&
        monstroCarregado instanceof Hidra && monstroCarregado.nivel === 4 &&
        Heroi.carregar({ nome: "x", classe: "Classe que não existe" }) === null;
});


teste("Saves com nomes antigos mantêm progresso e passam a usar somente a classe", function () {
    const nomes = [["Mago Daniel", "Mago"], ["Arqueira Diovana", "Arqueira"], ["Druida Vianey", "Druida"]];
    return Object.keys(CLASSES_HEROIS).length === 8 && nomes.every(([antigo, atual]) => {
        const original = novoHeroi(atual, 7);
        original.ganharXp(50);
        const salvo = { ...original.paraSalvar(), classe: antigo };
        const carregado = Heroi.carregar(JSON.parse(JSON.stringify(salvo)));
        return carregado !== null && carregado.constructor === original.constructor &&
            JSON.stringify(carregado.paraSalvar()) === JSON.stringify(original.paraSalvar()) &&
            carregado.getHpMaximo() === original.getHpMaximo() &&
            carregado.getMpMaximo() === original.getMpMaximo() &&
            salvo.classe === antigo && !Object.hasOwn(CLASSES_HEROIS, antigo);
    });
});

// ---------- Regressões da revisão de regras ----------

teste("HP/MP rejeitam valores negativos e não finitos sem alterar o estado", function () {
    const h = novoHeroi("Guerreiro");
    for (const metodo of ["receberDano", "curar", "gastarMp", "recuperarMp"]) {
        for (const valor of [-1, NaN, Infinity, "10"]) {
            if (!lancaErro(() => h[metodo](valor))) return false;
        }
    }
    return h.getHp() === h.getHpMaximo() && h.getMp() === h.getMpMaximo();
});

teste("Reduzir máximos limita HP e MP; estatísticas inválidas não mudam a base", function () {
    const h = novoHeroi("Mago");
    h.definirEstatisticas({ hp: 10, mp: 5 });
    return lancaErro(() => h.definirEstatisticas({ hp: NaN })) && h.getHp() === 10 && h.getMp() === 5;
});

teste("Carregamento rejeita chaves herdadas, tipos errados e XP incoerente", function () {
    const dados = novoHeroi("Guerreiro").paraSalvar();
    return ["toString", "constructor", "__proto__"].every(tipo =>
        Monstro.carregar({ tipo, nivel: 1 }) === null && Heroi.carregar({ ...dados, classe: tipo }) === null) &&
        [null, {}, [], ["Goblin"], { toString: null, valueOf: null }].every(tipo =>
            Monstro.carregar({ tipo, nivel: 1 }) === null) &&
        Heroi.carregar({ ...dados, nome: 10 }) === null && Heroi.carregar({ ...dados, xp: 100 }) === null &&
        Monstro.carregar({ tipo: "Goblin", nivel: 1.5 }) === null &&
        Heroi.carregar({ ...dados, nivel: 20, xp: 1 }) === null;
});

teste("Efeitos expostos são descrições imutáveis sem acesso ao estado interno", function () {
    const h = novoHeroi("Bárbaro");
    h.adicionarEfeito(new Furia());
    const lista = h.getEfeitos();
    return Object.isFrozen(lista) && Object.isFrozen(lista[0]) && lista[0].percentuais === undefined &&
        lista[0].passarTurno === undefined && h.getStat("defesa") === h.getStatBase("defesa") * 1.3;
});

teste("Petrificação cobre três respostas completas, sem consumir a rodada da aplicação", function () {
    const h = novoHeroi("Guerreiro"), b = novaBatalha(h, criarMonstro("Basilisco", 1));
    h.iniciarRodada(); h.adicionarEfeito(new Petrificado()); h.finalizarRodada(b);
    if (h.getEfeitos()[0].restante !== 3) return false;
    for (let rodada = 0; rodada < 3; rodada++) {
        h.iniciarRodada(); b.iniciarTurnoDe(h);
        // Estado no momento em que o monstro responde.
        if (!h.temEfeito("petrificado") || h.getStat("resVeneno") >= h.getStatBase("resVeneno")) return false;
        h.finalizarRodada(b);
    }
    return !h.temEfeito("petrificado");
});

teste("Renovar um debuff não consome a duração nova no fim da rodada antiga", function () {
    const h = novoHeroi("Guerreiro"), b = novaBatalha(h, criarMonstro("Goblin", 1));
    h.adicionarEfeito(new Petrificado()); h.iniciarRodada();
    h.adicionarEfeito(new Petrificado()); h.finalizarRodada(b);
    return h.getEfeitos().length === 1 && h.getEfeitos()[0].restante === 3;
});

teste("Veneno aplica exatamente três ticks; morte interrompe curas posteriores", function () {
    const h = novoHeroi("Guerreiro"), b = novaBatalha(h, criarMonstro("Goblin", 1));
    h.adicionarEfeito(new Envenenado(10));
    for (let i = 0; i < 4; i++) b.iniciarTurnoDe(h);
    if (h.getHp() !== h.getHpMaximo() - 30) return false;
    h.adicionarEfeito(new Envenenado(1000)); h.adicionarEfeito(new Bencao(100));
    return b.iniciarTurnoDe(h) === false && h.getHp() === 0;
});

teste("Atordoamento consome uma ação e depois permite agir novamente", function () {
    const h = novoHeroi("Guerreiro"), b = novaBatalha(h, criarMonstro("Goblin", 1));
    h.adicionarEfeito(new Atordoado());
    return b.iniciarTurnoDe(h) === false && b.iniciarTurnoDe(h) === true;
});

teste("Defender cobre múltiplos golpes diretos, mas não dano periódico", function () {
    const h = novoHeroi("Guerreiro"), b = novaBatalha(h, criarMonstro("Quimera", 1));
    const normal = b.calculadora.calcular(b.monstro, h, "fisico", 0.7, false);
    h.adicionarEfeito(new Defendendo());
    const hp = h.getHp();
    for (let i = 0; i < 3; i++) b.golpear(b.monstro, h, "fisico", 0.7);
    const perda = hp - h.getHp();
    b.causarDanoDeEfeito(h, 10, new Envenenado(10));
    return Math.abs(perda - normal * 1.5) <= 3 && hp - h.getHp() === perda + 10;
});

teste("Recarga 2 permite usar a habilidade nas ações 1 e 3", function () {
    const h = novoHeroi("Guerreiro"), b = novaBatalha(h, criarMonstro("Ogro", 20));
    b.agir(h, b.monstro, "habilidade");
    if (h.getRecarga() !== 1 || h.podeUsarHabilidade()) return false;
    b.agir(h, b.monstro, "atacar");
    return h.getRecarga() === 0 && h.podeUsarHabilidade();
});

teste("Resistências e MP não escalam exponencialmente; limites valem no modelo", function () {
    const h1 = novoHeroi("Paladino", 1), h20 = novoHeroi("Paladino", 20);
    h20.adicionarEfeito(new EfeitoDeAtributo("teste", "Teste", 1, "buff", { critico: 999, resVeneno: 999 }, {}));
    return h20.getMpMaximo() === h1.getMpMaximo() && h20.getStatBase("resSagrado") === h1.getStatBase("resSagrado") &&
        h20.getStat("critico") === REGRAS.criticoMaximo && h20.getStat("resVeneno") === REGRAS.resistenciaMaxima;
});

teste("Todas as 160 relações de vantagem correspondem aos dados", function () {
    for (const classe in CLASSES_HEROIS) for (const tipo in CLASSES_MONSTROS) {
        const h = novoHeroi(classe), m = criarMonstro(tipo, 1);
        if (h.multiplicadorContra(m) !== (DADOS_MONSTROS[tipo].fraquezas.includes(classe) ? REGRAS.bonusVantagem : 1)) return false;
        if (m.multiplicadorContra(h) !== (DADOS_MONSTROS[tipo].vantagens.includes(classe) ? REGRAS.bonusVantagem : 1)) return false;
    }
    return true;
});

teste("Inventário não fica negativo e monstros difíceis dão mais XP", function () {
    const i = new Inventario({ pocao: 1 });
    return i.consumir("pocao") && !i.consumir("pocao") && i.quantidade("pocao") === 0 &&
        lancaErro(() => i.adicionar("pocao", -1)) && criarMonstro("Dragão", 1).calcularXp(1) > criarMonstro("Goblin", 1).calcularXp(1);
});

teste("Vitória entrega recompensa uma única vez", function () {
    const h = novoHeroi("Guerreiro"), b = novaBatalha(h, criarMonstro("Goblin", 1));
    b.monstro.receberDano(10000); b.verificarFim(); const xp = h.xp;
    b.verificarFim(); b.jogarTurno("atacar");
    return h.xp === xp && xp > 0;
});

teste("Ação e calculadora novas são injetadas sem modificar Batalha", function () {
    let executou = false;
    class Esperar extends Acao { executar() { executou = true; } }
    const b = criarBatalha(novoHeroi("Guerreiro"), criarMonstro("Goblin", 1), { narrar() {} }, new SorteioFixo(0.5), {
        acoes: { atacar: new Atacar(), esperar: new Esperar() }, calculadora: { calcular() { return 7; } }
    });
    b.agir(b.heroi, b.monstro, "esperar"); const hp = b.monstro.getHp();
    b.agir(b.heroi, b.monstro, "atacar");
    return executou && hp - b.monstro.getHp() === 7;
});

teste("Atributos úteis excluem danos não utilizados e todas as sugestões são válidas", function () {
    return Object.keys(CLASSES_HEROIS).every(c => Heroi.validarAtributos(DISTRIBUICAO_RECOMENDADA[c].pontos) === null &&
        Heroi.atributosUteis(c).length * REGRAS.maxPorAtributo >= REGRAS.pontosAtributo) &&
        Heroi.ganhosDoAtributo("Guerreiro", "carisma").length === 0 &&
        !Heroi.tiposDeDano("Guerreiro").includes("magico");
});

// ---------- Mostra o resultado ----------

teste("Regressão: Paladino e Hidra no nível 20 não ficam presos em cura infinita", function () {
    class SorteioRegressao extends Sorteio {
        constructor(seed) { super(); this.seed = seed; }
        numero() { this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0; return this.seed / 4294967296; }
    }
    let vitorias = 0;
    for (let i = 0; i < 48; i++) {
        const b = novaBatalha(novoHeroi("Paladino", 20), criarMonstro("Hidra", 20), new SorteioRegressao(991 + i * 7919));
        b.simular();
        if (b.resultado === "empate") return false;
        if (b.resultado === "vitoria") vitorias++;
    }
    return vitorias >= 24;
});

const passaram = resultados.filter(function (r) { return r.passou; }).length;
let html = "<p class='resumo-testes'>" + passaram + " de " + resultados.length + " testes passaram</p><ul class='lista-testes'>";
for (const r of resultados) {
    const classe = r.passou ? "passou" : "falhou";
    const marca = r.passou ? "✔" : "✘";
    const erro = r.erro ? " — " + escaparHtml(r.erro) : "";
    html += "<li class='" + classe + "'>" + marca + " " + r.descricao + erro + "</li>";
}
html += "</ul>";
document.getElementById("resultado-testes").innerHTML = html;

// Uma batalha completa narrada no console do navegador (F12), usando a SaidaNoConsole
console.log("===== Batalha de demonstração (SaidaNoConsole) =====");
const demonstracao = criarBatalha(novoHeroi("Paladino"), criarMonstro("Lich", 1),
    new Narrador(new MensagensPtBr(), new SaidaNoConsole()), new Sorteio());
demonstracao.simular();
