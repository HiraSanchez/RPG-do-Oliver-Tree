// =====================================================================
// CALCULADORA DE DANO
// Só faz as contas do dano (responsabilidade única). Não escreve nada
// na tela e não sabe de turnos: quem cuida disso é a Batalha.
// =====================================================================

class CalculadoraDeDano {
    constructor(sorteio) {
        this.sorteio = sorteio;
    }

    calcular(atacante, defensor, tipoDano, multiplicador, critico) {
        const tipo = TIPOS_DANO[tipoDano];

        let dano = atacante.getStat(tipoDano) * multiplicador;
        dano = dano * atacante.multiplicadorContra(defensor); // vantagem de classe

        // Defesa com retorno decrescente: 50 de defesa = -50%, 100 = -67%...
        // A constante cresce com o nível do atacante; sem isso, em níveis
        // altos a defesa ficaria forte demais.
        if (tipo.defesa !== undefined) {
            const defesa = defensor.getStat(tipo.defesa);
            const constante = REGRAS.constanteDefesa * fatorDeNivel(atacante.nivel);
            dano = dano * (1 - defesa / (defesa + constante));
        }

        // Veneno e sagrado ignoram a defesa, mas sofrem a resistência (%)
        if (tipo.resistencia !== undefined) {
            const resistencia = limitar(defensor.getStat(tipo.resistencia), 0, REGRAS.resistenciaMaxima);
            dano = dano * (1 - resistencia / 100);
        }

        if (critico) {
            dano = dano * REGRAS.multiplicadorCritico;
        }

        // Efeitos do defensor, como "Defendendo" (metade do dano)
        for (const efeito of defensor.getEfeitos()) {
            dano = dano * efeito.multiplicadorDanoRecebido();
        }

        // Cada golpe varia um pouco (10% para mais ou para menos)
        const variacao = (this.sorteio.numero() * 2 - 1) * REGRAS.variacaoDano;
        dano = dano * (1 + variacao);

        return Math.max(1, Math.round(dano));
    }
}
