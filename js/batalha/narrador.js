// =====================================================================
// NARRADOR - transforma o que aconteceu na batalha em texto.
//
// A Batalha não escreve frases nem mexe na tela. Ela só avisa o
// narrador: narrar("dano", { atacante, defensor, valor... }).
// O narrador pede o texto para as Mensagens e entrega para uma Saída.
//
//  - Outro idioma?          -> nova classe de Mensagens (ex.: MensagensIngles)
//  - Mostrar em outro lugar? -> nova classe de Saída
// Nos dois casos a Batalha não muda (Responsabilidade Única + Aberto/Fechado
// + Inversão de Dependência: a Batalha recebe o narrador pronto).
// =====================================================================

class Narrador {
    constructor(mensagens, saida) {
        this.mensagens = mensagens;
        this.saida = saida;
    }

    narrar(chave, dados) {
        const texto = this.mensagens.texto(chave, dados);
        this.saida.escrever(chave, texto);
    }
}


// ---------- Mensagens em português ----------

class MensagensPtBr {
    texto(chave, d) {
        switch (chave) {
            case "inicio":
                return d.heroi.getTitulo() + " enfrenta " + d.monstro.getTitulo() + "!";
            case "vantagem":
                return d.heroi.nome + " sente uma energia favorável. Sua experiência contra " + d.monstro.nome + " lhe dá vantagem! (+" + this.porcentagem(REGRAS.bonusVantagem - 1) + " nos golpes diretos)";
            case "desvantagem":
                return d.monstro.nome + " tem um brilho sinistro nos olhos. Sua natureza é especialmente perigosa para " + d.heroi.nome + "! (+" + this.porcentagem(REGRAS.bonusVantagem - 1) + " de dano)";
            case "turno":
                return "Turno " + d.numero;
            case "hp":
                return d.heroi.nome + ": " + d.heroi.getHp() + "/" + d.heroi.getHpMaximo() + " HP · " +
                    d.monstro.nome + ": " + d.monstro.getHp() + "/" + d.monstro.getHpMaximo() + " HP";

            case "esquiva":
                if (d.defensorEhHeroi) {
                    return d.defensor.nome + " reage com reflexos felinos e esquiva habilmente do ataque!";
                }
                return d.defensor.nome + " se move com agilidade surpreendente e esquiva do ataque!";
            case "critico":
                return d.atacante.nome + " encontra uma abertura perfeita: golpe crítico!";
            case "dano":
                return this.quemGolpeou(d) + " causa " + d.valor + " de dano " + TIPOS_DANO[d.tipoDano].nome + " em " + d.defensor.nome + "!";

            case "habilidade":
                return d.ator.nome + " " + d.ator.habilidade.mensagem + "! [" + d.ator.habilidade.nome + "]";
            case "defesa":
                return d.ator.nome + " assume uma postura defensiva (dano recebido -" + this.porcentagem(REGRAS.reducaoDefendendo) + ") e recupera " + d.valor + " MP.";
            case "pocao":
                return d.ator.nome + " bebe uma poção e recupera " + d.valor + " HP. (" + d.restantes + " restantes)";
            case "regeneracao":
                return d.ator.nome + " regenera " + d.valor + " HP através de sua pele grossa.";
            case "cura-propria":
                return d.ator.nome + " regenera " + d.valor + " HP!";
            case "dreno":
                return d.alvo.nome + " perde " + d.valor + " de MP para o poder de " + d.ator.nome + "!";

            case "efeito":
                if (d.efeito.duracao === 1) {
                    return d.alvo.nome + " recebe o efeito " + d.efeito.nome + ".";
                }
                return d.alvo.nome + " recebe o efeito " + d.efeito.nome + " por " + d.efeito.duracao + " turnos.";
            case "resistencia":
                return d.alvo.nome + " resiste ao efeito " + d.efeito.nome + "!";
            case "dano-efeito":
                return d.alvo.nome + " sofre " + d.valor + " de dano (" + d.efeito.nome + ").";
            case "cura-efeito":
                return d.alvo.nome + " recupera " + d.valor + " HP (" + d.efeito.nome + ").";
            case "mana-efeito":
                return d.alvo.nome + " recupera " + d.valor + " MP através da melodia (" + d.efeito.nome + ").";
            case "fim-efeito":
                return "O efeito " + d.efeito.nome + " de " + d.alvo.nome + " terminou.";
            case "atordoado":
                return d.ator.nome + " está atordoado e perde a vez!";

            case "vitoria":
                return d.heroi.nome + " venceu a batalha! " + d.monstro.nome + " foi derrotado após uma luta épica!";
            case "derrota":
                return d.monstro.nome + " venceu a batalha! " + d.heroi.nome + " foi derrotado após uma luta épica!";
            case "empate":
                return "Após " + REGRAS.limiteTurnos + " turnos, ambos recuam exaustos. Empate!";
            case "xp":
                return d.heroi.nome + " ganha " + d.valor + " de experiência!";
            case "subiu-nivel":
                return d.heroi.nome + " subiu para o nível " + d.heroi.nivel + "! HP, dano e armaduras aumentaram; MP e resistências preservam seus valores.";
            case "nivel-maximo":
                return d.heroi.nome + " já está no nível máximo e não ganha mais experiência.";

            default:
                return "[mensagem sem texto: " + chave + "]";
        }
    }

    // 0.25 -> "25%"
    porcentagem(fracao) {
        return Math.round(fracao * 100) + "%";
    }

    // Ataque básico: "Fulano desfere um ataque e"  /  Habilidade: "Golpe Poderoso"
    quemGolpeou(d) {
        if (d.nomeDoGolpe !== null) {
            return d.nomeDoGolpe;
        }
        if (d.tipoDano === "magico") {
            return d.atacante.nome + " lança um ataque mágico e";
        }
        if (d.tipoDano === "veneno") {
            return d.atacante.nome + " lança um ataque venenoso e";
        }
        if (d.tipoDano === "sagrado") {
            return d.atacante.nome + " golpeia com luz sagrada e";
        }
        return d.atacante.nome + " desfere um ataque e";
    }
}


// ---------- Saídas (para onde o texto vai) ----------

// Escreve no quadro de log da página. A chave vira a cor (classe CSS "log-chave").
class SaidaNaTela {
    constructor(elemento) {
        this.elemento = elemento;
    }

    escrever(chave, texto) {
        const linha = document.createElement("div");
        linha.className = "log-" + chave;
        linha.textContent = texto; // textContent: o nome do herói nunca vira HTML
        this.elemento.appendChild(linha);
        this.elemento.scrollTop = this.elemento.scrollHeight;
    }

    limpar() {
        this.elemento.innerHTML = "";
    }
}

// Escreve no console do navegador (F12). Útil para testar a batalha sem tela.
class SaidaNoConsole {
    escrever(chave, texto) {
        console.log(texto);
    }
}
