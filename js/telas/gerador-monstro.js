// =====================================================================
// <gerador-monstro> - escolhe ou sorteia um monstro (passo 2).
// Usado em monstro.html.
// O monstro gerado é salvo no navegador para a página de Batalha usar.
// =====================================================================

class GeradorMonstro extends HTMLElement {
    connectedCallback() {
        if (this.saida) {
            return; // já foi montado
        }

        this.monstro = null;
        this.sorteio = new Sorteio();
        this.heroi = Heroi.carregar(armazenamento.ler(CHAVE_HEROI_SALVO));

        let opcoesTipo = "";
        for (const tipo in CLASSES_MONSTROS) {
            opcoesTipo += '<option value="' + tipo + '">' + tipo + "</option>";
        }

        // Até 2 níveis acima do nível máximo do herói
        let opcoesNivel = "";
        for (let nivel = 1; nivel <= REGRAS.nivelMaximo + 2; nivel++) {
            opcoesNivel += '<option value="' + nivel + '">Nível ' + nivel + "</option>";
        }

        // Lembra qual é o herói (ou avisa que ainda não tem um)
        let textoHeroi = 'Você ainda não criou um herói. <a href="index.html">Criar herói</a>';
        if (this.heroi !== null) {
            textoHeroi = "Seu herói: <strong>" + escaparHtml(this.heroi.getTitulo()) + "</strong>";
        }

        this.innerHTML = `
            <p class="heroi-atual">${textoHeroi}</p>
            <div class="controles-monstro">
                <div class="campo">
                    <label for="tipo-monstro">Monstro</label>
                    <select id="tipo-monstro" data-tipo>
                        <option value="">Aleatório</option>
                        ${opcoesTipo}
                    </select>
                </div>
                <div class="campo">
                    <label for="nivel-monstro">Nível</label>
                    <select id="nivel-monstro" data-nivel>
                        <option value="">Seu nível até +1</option>
                        ${opcoesNivel}
                    </select>
                </div>
                <button type="button" data-gerar>Gerar Monstro</button>
            </div>
            <div class="output" data-saida hidden></div>`;

        this.saida = this.querySelector("[data-saida]");
        this.querySelector("[data-gerar]").addEventListener("click", () => this.gerar());

        this.restaurarSalvo();
    }

    gerar() {
        let tipo = this.querySelector("[data-tipo]").value;
        if (tipo === "") {
            tipo = this.sorteio.item(Object.keys(CLASSES_MONSTROS));
        }

        // Sem nível escolhido: do nível do herói até 1 acima (o desafio cresce junto).
        // Para um desafio maior, o jogador escolhe o nível na lista.
        let nivel = parseInt(this.querySelector("[data-nivel]").value);
        if (isNaN(nivel)) {
            const nivelHeroi = this.nivelDoHeroi();
            nivel = this.sorteio.inteiro(nivelHeroi, nivelHeroi + 1);
        }

        this.monstro = criarMonstro(tipo, nivel);
        armazenamento.salvar(CHAVE_MONSTRO_SALVO, this.monstro.paraSalvar());
        this.mostrarFicha("Monstro gerado");
    }

    // Mostra o último monstro gerado, se tiver
    restaurarSalvo() {
        const monstro = Monstro.carregar(armazenamento.ler(CHAVE_MONSTRO_SALVO));
        if (monstro !== null) {
            this.monstro = monstro;
            this.mostrarFicha("Monstro atual");
        }
    }

    mostrarFicha(selo) {
        this.saida.hidden = false;
        this.saida.innerHTML = Ficha.html(this.monstro, selo) +
            '<a class="link-passo" href="batalha.html">Próximo passo: ir para a batalha ⚔</a>';
    }

    nivelDoHeroi() {
        if (this.heroi !== null) {
            return this.heroi.nivel;
        }
        return 1;
    }
}

customElements.define("gerador-monstro", GeradorMonstro);
