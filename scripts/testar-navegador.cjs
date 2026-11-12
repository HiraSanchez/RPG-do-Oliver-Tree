// Preparação opcional: npm install --prefix tmp/browser-check playwright
const { chromium } = require('../tmp/browser-check/node_modules/playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

(async () => {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    try {
        const page = await browser.newPage();
        const erros = []; page.on('pageerror', e => erros.push(e.message));
        const url = f => pathToFileURL(path.resolve(__dirname, '..', f)).href;
        await page.goto(url('testes.html'));
        assert.equal(await page.locator('.falhou').count(), 0);
        console.log(await page.locator('.resumo-testes').innerText());
        await page.goto(url('index.html'));
        await page.locator('[name=nome]').fill('<Teste>');
        await page.locator('[name=classe]').selectOption('Guerreiro');
        assert.match(await page.locator('[data-ganhos=carisma]').innerText(), /Sem efeito/);
        await page.locator('[data-distribuir]').click();
        assert.equal(await page.locator('[name=carisma]').inputValue(), '0');
        await page.locator('[data-recomendado]').click();
        await page.locator('[type=submit]').click();
        await page.locator('.link-passo').click();
        await page.locator('[data-tipo]').selectOption('Goblin');
        await page.locator('[data-nivel]').selectOption('1');
        await page.locator('[data-gerar]').click();
        assert.match(await page.locator('[data-saida]').innerText(), /Comum/);
        await page.locator('.link-passo').click();
        assert.match(await page.locator('[data-cartao=heroi] h3').innerText(), /<Teste>/);
        await page.keyboard.press('"'); await page.keyboard.press('\\');
        assert.deepEqual(erros, []);
        // Remontar o componente deve manter exatamente um listener global.
        await page.evaluate(() => { const a = document.querySelector('arena-batalha'), pai = a.parentElement; a.remove(); pai.append(a); });
        await page.keyboard.press('1');
        assert.equal(await page.evaluate(() => document.querySelector('arena-batalha').batalha.turno), 2);
        await page.evaluate(() => { const a = document.querySelector('arena-batalha'); while (!a.batalha.terminou()) a.jogar(null); });
        assert.match(await page.locator('[data-resultado]').innerText(), /Vitória/);
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('rpg:ultimoPersonagem')).xp), 16);
        await page.locator('[data-reiniciar]').click();
        assert.match(await page.locator('[data-cartao=heroi] [data-barra=hp]').innerText(), /140 \/ 140/);
        await page.evaluate(() => { Storage.prototype.setItem = () => { throw Error('bloqueado'); }; const a = document.querySelector('arena-batalha'); a.batalha.monstro.receberDano(99999); a.jogar('atacar'); });
        assert.match(await page.locator('[data-aviso]').innerText(), /Não foi possível salvar/);
        await page.goto(url('index.html'));
        await page.evaluate(() => { Storage.prototype.setItem = () => { throw Error('bloqueado'); }; });
        await page.locator('[type=submit]').click();
        assert.match(await page.locator('[data-erro]').innerText(), /Não foi possível salvar/);
        await page.reload();
        await page.evaluate(() => localStorage.setItem('rpg:ultimoPersonagem', JSON.stringify({ nome: 'x', classe: 'constructor', atributos: {} })));
        await page.reload();
        assert.equal(await page.locator('[name=classe]').inputValue(), '');
        assert.deepEqual(erros, []);
        console.log('Navegador: fluxo completo, atalhos, remontagem, persistência, armazenamento negado e save corrompido OK.');
    } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
