class Recompensas {
    entregar(heroi, monstro) {
        if (heroi.estaNoNivelMaximo()) return { xp: 0, niveis: 0 };
        const xp = monstro.calcularXp(heroi.nivel);
        return { xp, niveis: heroi.ganharXp(xp) };
    }
}
