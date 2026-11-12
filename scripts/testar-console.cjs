const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'rpg-console-test-'));
const save = path.join(pasta, 'save.json');
function executar(input, args = []) {
    const r = spawnSync(process.execPath, [path.join(__dirname, '../rpg.cjs'), ...args], {
        input, encoding: 'utf8', timeout: 15000, env: { ...process.env, RPG_SAVE_FILE: save }
    });
    assert.equal(r.status, 0, r.stderr || r.error?.message);
    return r.stdout;
}
const saida = executar('Teste\n1\n1\n1\n1\n2\n2\n4\na\nn\n');
assert.match(saida, /Ação indisponível/);
assert.match(saida, /Resultado: vitoria/);
assert.match(saida, /bebe uma poção/);
assert.equal(JSON.parse(fs.readFileSync(save, 'utf8')).xp, 16);
assert.match(executar('s\n0\n'), /Continuar salvo/);
fs.writeFileSync(save, '{corrompido');
assert.match(executar(''), /Save inválido/);
assert.match(executar('', ['--demo']), /Demonstração concluída/);
// Somente os arquivos deste diretório de teste são removidos.
fs.unlinkSync(save); fs.rmdirSync(pasta);
console.log('Console: criação, validação de ação, poção, vitória, save, continuação, corrupção e demonstração OK.');
