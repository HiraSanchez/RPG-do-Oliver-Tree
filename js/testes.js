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
    return new Batalha(heroi, monstro, narrador, sorteio);
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
    const nomes = new Set();
    for (const classe in CLASSES_HEROIS) {
        nomes.add(novoHeroi(classe).habilidade.nome);
    }
    return nomes.size === Object.keys(CLASSES_HEROIS).length;
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
    new Batalha(novoHeroi("Bardo"), criarMonstro("Ogro", 1), new Narrador(new MensagensPtBr(), saida), new Sorteio());
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
    const mago = novoHeroi("Mago Daniel");
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
    const heroi = novoHeroi("Druida Vianey", 7);
    heroi.ganharXp(50);
    const heroiCarregado = Heroi.carregar(JSON.parse(JSON.stringify(heroi.paraSalvar())));
    const monstroCarregado = Monstro.carregar({ tipo: "Hidra", nivel: 4 });
    return heroiCarregado instanceof DruidaVianey && heroiCarregado.nivel === 7 && heroiCarregado.xp === heroi.xp &&
        monstroCarregado instanceof Hidra && monstroCarregado.nivel === 4 &&
        Heroi.carregar({ nome: "x", classe: "Classe que não existe" }) === null;
});


// ---------- Mostra o resultado ----------

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
const demonstracao = new Batalha(novoHeroi("Paladino"), criarMonstro("Lich", 1),
    new Narrador(new MensagensPtBr(), new SaidaNoConsole()), new Sorteio());
demonstracao.simular();
