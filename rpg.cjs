#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const { carregarJogo } = require('./scripts/carregar-jogo.cjs');
const { api: g } = carregarJogo();
const arquivoSalvo = process.env.RPG_SAVE_FILE || path.join(__dirname, '.rpg-save.json');

function mostrarFicha(h) {
    console.log(`\n${h.getTitulo()} | HP ${h.getHp()}/${h.getHpMaximo()} | MP ${h.getMp()}/${h.getMpMaximo()}`);
    console.log(`Habilidade: ${h.habilidade.nome} (${h.habilidade.custo} MP, a cada ${h.habilidade.recarga} ações)`);
    console.log(h.habilidade.descricao);
    console.log(`Forte contra: ${h.getForteContra().join(', ')}. Fraco contra: ${h.getFracoContra().join(', ')}.`);
}

async function main() {
    console.log('RPG DO OLIVER TREE — Terminal\n');
    if (process.argv.includes('--demo')) {
        class SorteioDemo extends g.Sorteio { numero() { return 0.5; } }
        const h = g.criarHeroi('Oliver', 'Guerreiro', g.DISTRIBUICAO_RECOMENDADA.Guerreiro.pontos);
        mostrarFicha(h);
        const b = g.criarBatalha(h, g.criarMonstro('Goblin', 1), new g.Narrador(new g.MensagensPtBr(), new g.SaidaNoConsole()), new SorteioDemo());
        b.simular();
        console.log('\nDemonstração concluída. Execute node rpg.cjs para escolher suas ações.');
        return;
    }
    const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
    const linhas = rl[Symbol.asyncIterator]();
    async function perguntar(texto, padrao = '') {
        process.stdout.write(texto);
        const { value, done } = await linhas.next();
        if (done) throw new Error('ENTRADA_ENCERRADA');
        return value.trim() || padrao;
    }
    async function escolher(texto, opcoes, padrao) {
        while (true) {
            const valor = await perguntar(texto, padrao);
            if (opcoes.includes(valor)) return valor;
            console.log('Opção inválida. Escolha: ' + opcoes.join(', '));
        }
    }
    function salvar(h) {
        try { fs.writeFileSync(arquivoSalvo, JSON.stringify(h.paraSalvar(), null, 2)); }
        catch { console.log('Aviso: não foi possível salvar o progresso em ' + arquivoSalvo); }
    }
    let heroi = null;
    try {
        try { heroi = g.Heroi.carregar(JSON.parse(fs.readFileSync(arquivoSalvo, 'utf8'))); }
        catch (erro) { if (erro.code !== 'ENOENT') console.log('Save inválido ou inacessível. Você pode criar outro herói.'); }
        if (heroi) {
            mostrarFicha(heroi);
            if (await escolher('Continuar salvo? [s/n, padrão s]: ', ['s', 'n'], 's') === 'n') heroi = null;
        }
        if (!heroi) {
            let nome;
            do { nome = await perguntar('Nome do herói (1 a 24 caracteres): '); } while (!nome || nome.length > 24);
            const classes = Object.keys(g.CLASSES_HEROIS);
            classes.forEach((classe, i) => console.log(`${i + 1}. ${classe}: ${g.DADOS_HEROIS[classe].descricao}`));
            const classe = classes[Number(await escolher('Classe: ', classes.map((_, i) => String(i + 1)))) - 1];
            let atributos = { ...g.DISTRIBUICAO_RECOMENDADA[classe].pontos };
            if (await escolher('Atributos: 1 sugeridos, 2 distribuir manualmente [1]: ', ['1', '2'], '1') === '2') {
                let erro;
                do {
                    for (const a of g.ATRIBUTOS) {
                        const ganhos = g.Heroi.ganhosDoAtributo(classe, a.id);
                        console.log(a.nome + ': ' + (ganhos.length ? ganhos.map(x => `+${x.ganho} ${g.ESTATISTICAS[x.stat]}`).join(', ') : 'sem efeito nesta classe'));
                        atributos[a.id] = Number(await perguntar(`${a.nome} (0–10): `, '0'));
                    }
                    erro = g.Heroi.validarAtributos(atributos);
                    if (erro) console.log(erro);
                } while (erro);
            }
            heroi = g.criarHeroi(nome, classe, atributos);
            salvar(heroi);
        }
        const rng = new g.Sorteio();
        while (true) {
            mostrarFicha(heroi);
            const tipos = Object.keys(g.CLASSES_MONSTROS);
            tipos.forEach((tipo, i) => console.log(`${i + 1}. ${tipo} (${g.DADOS_MONSTROS[tipo].categoria}, XP ×${g.DADOS_MONSTROS[tipo].recompensa})`));
            const opcao = await escolher('Monstro: número, a aleatório, 0 sair: ', ['0', 'a', ...tipos.map((_, i) => String(i + 1))]);
            if (opcao === '0') break;
            const tipo = opcao === 'a' ? rng.item(tipos) : tipos[Number(opcao) - 1];
            const nivel = Number(await escolher(`Nível do monstro (1–22) [${heroi.nivel}]: `,
                Array.from({ length: 22 }, (_, i) => String(i + 1)), String(heroi.nivel)));
            const b = g.criarBatalha(heroi, g.criarMonstro(tipo, nivel), new g.Narrador(new g.MensagensPtBr(), new g.SaidaNoConsole()), rng);
            while (!b.terminou()) {
                console.log(`\nHP ${heroi.getHp()}/${heroi.getHpMaximo()} | MP ${heroi.getMp()}/${heroi.getMpMaximo()} | Poções ${b.pocoes} | Recarga ${heroi.getRecarga()}`);
                console.log('Efeitos: ' + (heroi.getEfeitos().map(e => `${e.nome} (${e.restante})`).join(', ') || 'nenhum'));
                const comando = await escolher('1 atacar | 2 habilidade | 3 defender | 4 poção | a automático | 0 sair: ', ['0', '1', '2', '3', '4', 'a']);
                if (comando === '0') return;
                if (comando === 'a') { b.simular(); break; }
                const acao = { 1: 'atacar', 2: 'habilidade', 3: 'defender', 4: 'pocao' }[comando];
                if (!b.acoes[acao].podeExecutar(heroi, b)) { console.log('Ação indisponível; escolha outra sem gastar o turno.'); continue; }
                b.jogarTurno(acao);
            }
            salvar(heroi);
            console.log(`Resultado: ${b.resultado}. Rodadas: ${Math.min(b.turno, g.REGRAS.limiteTurnos)}. XP recebido: ${b.recompensaXp}.`);
            if (await escolher('Outra batalha? [s/n, padrão s]: ', ['s', 'n'], 's') === 'n') break;
        }
    } catch (erro) {
        if (erro.message !== 'ENTRADA_ENCERRADA') throw erro;
    } finally { rl.close(); }
}

main().catch(erro => { console.error(erro.message); process.exitCode = 1; });
