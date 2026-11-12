// Prepara somente os arquivos usados pelo jogo no navegador.
const fs = require('node:fs');
const path = require('node:path');

const raiz = path.resolve(__dirname, '..');
const destino = path.join(raiz, 'dist');
// A limpeza fica restrita à pasta gerada, sem seguir links para outras pastas.
if (fs.existsSync(destino) && fs.lstatSync(destino).isSymbolicLink()) {
    throw new Error('A pasta dist não pode ser um link simbólico.');
}
fs.rmSync(destino, { recursive: true, force: true });
fs.mkdirSync(destino);

for (const arquivo of ['index.html', 'monstro.html', 'batalha.html']) {
    fs.copyFileSync(path.join(raiz, arquivo), path.join(destino, arquivo));
}
for (const pasta of ['css', 'js', 'Imagens']) {
    fs.cpSync(path.join(raiz, pasta), path.join(destino, pasta), {
        recursive: true,
        filter: origem => origem !== path.join(raiz, 'js', 'testes.js')
    });
}
console.log('Site preparado em dist/: páginas, estilos, scripts do jogo e imagens.');
