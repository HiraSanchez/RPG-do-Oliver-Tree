const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Os mesmos scripts clássicos continuam funcionando por file:// no navegador.
const arquivos = ['util', 'dados', 'modelo/efeitos', 'modelo/inventario', 'modelo/combatente',
    'modelo/herois', 'modelo/monstros', 'batalha/dano', 'batalha/acoes', 'batalha/narrador',
    'batalha/batalha', 'batalha/recompensas', 'batalha/fabrica'];

function carregarJogo(globais = {}) {
    const contexto = vm.createContext({ console, ...globais });
    for (const arquivo of arquivos) {
        vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', arquivo + '.js'), 'utf8'), contexto, { filename: arquivo });
    }
    const api = vm.runInContext(`({ REGRAS, ATRIBUTOS, ESTATISTICAS, DADOS_HEROIS, DADOS_MONSTROS,
        DISTRIBUICAO_RECOMENDADA, CLASSES_HEROIS, CLASSES_MONSTROS, TIPOS_DANO,
        Heroi, Monstro, Combatente, Inventario, Efeito, EfeitoDeAtributo, Envenenado, Queimando,
        Bencao, Regeneracao, Inspirado, Furia, MiraPrecisa, FormaDePedra, Petrificado, Atordoado, Defendendo,
        Acao, Atacar, UsarHabilidade, Defender, UsarPocao, Recompensas, Batalha, CalculadoraDeDano,
        criarHeroi, criarMonstro, criarBatalha, Sorteio, Narrador, MensagensPtBr, SaidaNoConsole,
        fatorDeNivel, limiteEstatistica, armazenamento, temHabilidadeEspecial })`, contexto);
    return { api, contexto };
}
module.exports = { carregarJogo, arquivos };
