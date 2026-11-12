// Ponto de composição compartilhado pelo navegador, terminal e testes.
// Uma ação nova pode ser injetada aqui sem alterar a classe Batalha.
function criarBatalha(heroi, monstro, narrador, sorteio = new Sorteio(), opcoes = {}) {
    return new Batalha(heroi, monstro, {
        narrador,
        sorteio,
        calculadora: new CalculadoraDeDano(sorteio),
        acoes: { atacar: new Atacar(), habilidade: new UsarHabilidade(), defender: new Defender(), pocao: new UsarPocao() },
        inventario: new Inventario({ pocao: REGRAS.pocoesPorBatalha }),
        recompensas: new Recompensas(),
        ...opcoes
    });
}
