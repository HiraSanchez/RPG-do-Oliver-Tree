const fs = require('node:fs');
const path = require('node:path');
const { carregarJogo } = require('./carregar-jogo.cjs');
const { api: g } = carregarJogo();
const args = process.argv.slice(2);
const opcao = (nome, padrao) => {
    const junto = args.find(arg => arg.startsWith(nome + '='));
    if (junto !== undefined) return junto.slice(nome.length + 1);
    const i = args.indexOf(nome);
    return i < 0 ? padrao : args[i + 1];
};
const amostras = Number(opcao('--amostras', '100'));
const niveis = opcao('--niveis', '1,5,10,20').split(',').map(Number);
const deltas = opcao('--deltas', '0,1,2').split(',').map(Number);
const semente = Number(opcao('--semente', '1234567'));
const politica = opcao('--politica', 'padrao');
const distribuicao = opcao('--atributos', 'recomendados');
if (!Number.isInteger(amostras) || amostras < 1 || amostras > 10000 || !Number.isSafeInteger(semente) ||
    !niveis.every(n => Number.isInteger(n) && n >= 1 && n <= 20) ||
    !deltas.every(d => Number.isInteger(d) && niveis.every(n => n + d >= 1 && n + d <= 22)) ||
    !['padrao', 'agressiva', 'cautelosa', 'basica'].includes(politica) ||
    !['recomendados', 'aleatorios'].includes(distribuicao)) throw Error('Parâmetros inválidos.');

class SorteioSeed extends g.Sorteio {
    constructor(seed) { super(); this.seed = seed >>> 0; }
    numero() { this.seed = (Math.imul(1664525, this.seed) + 1013904223) >>> 0; return this.seed / 4294967296; }
}

function atributos(classe, rng) {
    if (distribuicao === 'recomendados') return g.DISTRIBUICAO_RECOMENDADA[classe].pontos;
    const a = Object.fromEntries(g.ATRIBUTOS.map(x => [x.id, 0]));
    const uteis = g.Heroi.atributosUteis(classe);
    for (let i = 0; i < g.REGRAS.pontosAtributo; i++) a[rng.item(uteis.filter(x => a[x.id] < g.REGRAS.maxPorAtributo)).id]++;
    return a;
}

function decisao(h, b) {
    if (politica === 'padrao') return null;
    const limiar = politica === 'cautelosa' ? 0.6 : 0.35;
    if (h.getHp() < h.getHpMaximo() * limiar && b.pocoes > 0) return 'pocao';
    if (politica === 'basica') return 'atacar';
    if (h.podeUsarHabilidade()) return 'habilidade';
    if (politica === 'cautelosa' && h.getRecarga() === 0 && h.getMp() < h.habilidade.custo) return 'defender';
    return 'atacar';
}

const resultado = { metodologia: { amostras, niveis, deltas, semente, politica, distribuicao }, simulacoes: [] };
for (const nivel of niveis) for (const diferenca of deltas) {
    const grupo = { nivel, diferenca, total: 0, vitorias: 0, empates: 0, classes: {}, monstros: {}, pares: [] };
    for (const [ci, classe] of Object.keys(g.CLASSES_HEROIS).entries()) for (const [mi, tipo] of Object.keys(g.CLASSES_MONSTROS).entries()) {
        let vitorias = 0, empates = 0, turnos = 0, maxTurnos = 0, pocoes = 0;
        for (let i = 0; i < amostras; i++) {
            const seed = semente + i * 7919 + ci * 104729 + mi * 15485863 + nivel * 101 + diferenca * 307;
            const h = g.criarHeroi('Simulação', classe, atributos(classe, new SorteioSeed(seed ^ 0x9e3779b9)), nivel);
            const b = g.criarBatalha(h, g.criarMonstro(tipo, nivel + diferenca), { narrar() {} }, new SorteioSeed(seed));
            while (!b.terminou()) b.jogarTurno(decisao(h, b));
            vitorias += b.resultado === 'vitoria'; empates += b.resultado === 'empate';
            turnos += Math.min(b.turno, g.REGRAS.limiteTurnos); maxTurnos = Math.max(maxTurnos, Math.min(b.turno, g.REGRAS.limiteTurnos));
            pocoes += g.REGRAS.pocoesPorBatalha - b.pocoes;
            if (![h.getHp(), h.getMp(), b.monstro.getHp(), b.monstro.getMp()].every(Number.isFinite)) throw Error('Estado não finito');
        }
        grupo.total += amostras; grupo.vitorias += vitorias; grupo.empates += empates;
        for (const [map, key] of [[grupo.classes, classe], [grupo.monstros, tipo]]) {
            map[key] ??= { n: 0, vitorias: 0, empates: 0 }; map[key].n += amostras; map[key].vitorias += vitorias; map[key].empates += empates;
        }
        grupo.pares.push({ classe, tipo, n: amostras, vitorias, empates, turnosMedios: turnos / amostras, maxTurnos, pocoesMedias: pocoes / amostras });
    }
    resultado.simulacoes.push(grupo);
    console.log(`Nível ${nivel}, diferença ${diferenca}: ${(100 * grupo.vitorias / grupo.total).toFixed(1)}% vitórias; ${grupo.empates} empates / ${grupo.total}`);
}
const saida = opcao('--saida', null);
if (saida) { fs.mkdirSync(path.dirname(saida), { recursive: true }); fs.writeFileSync(saida, JSON.stringify(resultado, null, 2)); }
else console.log(JSON.stringify(resultado));
