// =====================================================================
// UTIL - funções pequenas usadas em várias partes do jogo
// =====================================================================

// Mantém um valor entre um mínimo e um máximo
function limitar(valor, minimo, maximo) {
    if (valor < minimo) {
        return minimo;
    }
    if (valor > maximo) {
        return maximo;
    }
    return valor;
}

// Os métodos do modelo rejeitam entradas inválidas antes de alterar o estado.
function numeroNaoNegativo(valor, nome = "Valor") {
    if (!Number.isFinite(valor) || valor < 0) {
        throw new RangeError(nome + " deve ser um número finito não negativo.");
    }
    return valor;
}

// Troca os caracteres especiais do HTML.
// Todo texto digitado pelo usuário passa por aqui antes de ir para o innerHTML,
// senão alguém poderia colocar código no nome do herói.
function escaparHtml(texto) {
    return String(texto)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}


// Tudo que é aleatório no jogo passa por esta classe.
// A Batalha recebe um Sorteio pelo construtor (inversão de dependência):
// assim, num teste, dá para trocar por um sorteio "viciado".
class Sorteio {
    // Número quebrado entre 0 e 1
    numero() {
        return Math.random();
    }

    // Número inteiro entre minimo e maximo (os dois entram no sorteio)
    inteiro(minimo, maximo) {
        return Math.floor(this.numero() * (maximo - minimo + 1)) + minimo;
    }

    // chance(25) dá verdadeiro em 25% das vezes
    chance(porcentagem) {
        return this.numero() * 100 < porcentagem;
    }

    // Um item qualquer da lista
    item(lista) {
        const posicao = Math.floor(this.numero() * lista.length);
        return lista[posicao];
    }
}


// Guarda o herói e o monstro no navegador (localStorage), assim cada
// página (Personagem -> Monstro -> Batalha) sabe o que foi feito na anterior.
const CHAVE_HEROI_SALVO = "rpg:ultimoPersonagem";
const CHAVE_MONSTRO_SALVO = "rpg:ultimoMonstro";

const armazenamento = {
    ler: function (chave) {
        try {
            return JSON.parse(localStorage.getItem(chave));
        } catch (erro) {
            return null;
        }
    },

    salvar: function (chave, valor) {
        try {
            localStorage.setItem(chave, JSON.stringify(valor));
            return true;
        } catch (erro) {
            return false;
        }
    }
};
