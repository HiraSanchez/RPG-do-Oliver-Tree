// =====================================================================
// <criador-personagem> - formulário de criação do herói (passo 1).
// Usado em index.html.
//
// O herói criado é salvo no navegador, e as páginas de Monstro e de
// Batalha leem de lá.
// =====================================================================

class CriadorPersonagem extends HTMLElement {
    connectedCallback() {
        if (this.form) {
            return; // já foi montado
        }

        this.personagem = null;
        this.sorteio = new Sorteio();
        this.innerHTML = this.montarHtml();
        this.form = this.querySelector("form");
        this.saida = this.querySelector("[data-saida]");
        this.dica = this.querySelector("[data-dica]");

        this.form.addEventListener("input", (evento) => this.aoDigitar(evento));
        this.form.addEventListener("focusout", (evento) => this.aoSairDoCampo(evento));
        this.form.addEventListener("click", (evento) => this.aoClicar(evento));
        this.form.addEventListener("submit", (evento) => {
            evento.preventDefault();
            this.criar();
        });

        this.atualizar();
        this.restaurarSalvo();
    }

    montarHtml() {
        let opcoesClasse = "";
        for (const classe in CLASSES_HEROIS) {
            opcoesClasse += '<option value="' + classe + '">' + classe + "</option>";
        }

        let camposAtributo = "";
        for (const a of ATRIBUTOS) {
            camposAtributo += `
                <div class="atributo">
                    <label for="atributo-${a.id}">${a.nome}</label>
                    <small>${a.descricao}</small>
                    <div class="contador">
                        <button type="button" class="botao-contador" data-atributo="${a.id}" data-passo="-1" aria-label="Diminuir ${a.nome}">−</button>
                        <input type="number" id="atributo-${a.id}" name="${a.id}" min="0" max="${REGRAS.maxPorAtributo}" value="0" inputmode="numeric">
                        <button type="button" class="botao-contador" data-atributo="${a.id}" data-passo="1" aria-label="Aumentar ${a.nome}">+</button>
                    </div>
                </div>`;
        }

        return `
            <form class="form-personagem" novalidate>
                <label for="nome-personagem">Nome do herói</label>
                <input type="text" id="nome-personagem" name="nome" maxlength="24" placeholder="Nome do Personagem" autocomplete="off">

                <label for="classe-personagem">Classe</label>
                <select id="classe-personagem" name="classe">
                    <option value="">Escolha sua classe</option>
                    ${opcoesClasse}
                </select>
                <p class="classe-descricao" data-descricao></p>

                <div class="pontos-total">Pontos disponíveis: <span data-pontos></span></div>
                <div class="botoes botoes-atributos">
                    <button type="button" class="botao-destaque" data-recomendado title="Escolha uma classe primeiro">Recomendado para a classe</button>
                    <button type="button" class="botao-secundario" data-distribuir>Aleatório</button>
                    <button type="button" class="botao-secundario" data-zerar>Zerar</button>
                </div>
                <p class="dica" data-dica hidden></p>
                <div class="atributos-container">${camposAtributo}</div>

                <p class="mensagem-erro" data-erro role="alert"></p>
                <div class="botoes">
                    <button type="submit">Criar Personagem</button>
                </div>
            </form>
            <div class="resultado" data-saida hidden></div>`;
    }

    // ---------- Leitura e escrita dos campos ----------

    lerAtributos() {
        const atributos = {};
        for (const a of ATRIBUTOS) {
            atributos[a.id] = parseInt(this.form.elements[a.id].value) || 0;
        }
        return atributos;
    }

    definirAtributos(valores) {
        for (const a of ATRIBUTOS) {
            let valor = valores[a.id];
            if (valor === undefined) {
                valor = 0;
            }
            this.form.elements[a.id].value = valor;
        }
    }

    // Mantém o atributo entre 0 e o máximo, sem passar do total de pontos
    ajustarAtributo(id, valor) {
        const atributos = this.lerAtributos();
        const usadosPelosOutros = Heroi.totalDePontos(atributos) - atributos[id];
        const maximo = Math.min(REGRAS.maxPorAtributo, REGRAS.pontosAtributo - usadosPelosOutros);
        this.form.elements[id].value = limitar(valor, 0, maximo);
    }

    // ---------- Eventos do formulário ----------

    aoDigitar(evento) {
        const campo = evento.target;
        // Campo vazio é permitido enquanto a pessoa digita (vira 0 ao sair do campo)
        if (campo.type === "number" && campo.value !== "") {
            this.ajustarAtributo(campo.name, parseInt(campo.value) || 0);
        }
        if (campo.type === "number" || campo.name === "classe") {
            this.mostrarDica("");
        }
        this.atualizar();
    }

    aoSairDoCampo(evento) {
        const campo = evento.target;
        if (campo.type === "number" && campo.value === "") {
            campo.value = 0;
            this.atualizar();
        }
    }

    aoClicar(evento) {
        const botao = evento.target.closest("button");
        if (!botao || botao.disabled) {
            return;
        }

        let dica = "";
        if (botao.dataset.atributo) {
            // botões + e −
            const campo = this.form.elements[botao.dataset.atributo];
            const novoValor = (parseInt(campo.value) || 0) + Number(botao.dataset.passo);
            this.ajustarAtributo(campo.name, novoValor);
        } else if (botao.hasAttribute("data-recomendado")) {
            const recomendacao = DISTRIBUICAO_RECOMENDADA[this.form.elements.classe.value];
            this.definirAtributos(recomendacao.pontos);
            dica = recomendacao.motivo;
        } else if (botao.hasAttribute("data-distribuir")) {
            this.distribuirAleatorio();
        } else if (botao.hasAttribute("data-zerar")) {
            this.definirAtributos({});
        } else {
            return; // botão de enviar: quem cuida é o "submit"
        }
        this.atualizar();
        this.mostrarDica(dica);
    }

    // Distribui os pontos um por um, em atributos que ainda não chegaram no máximo
    distribuirAleatorio() {
        const valores = {};
        for (const a of ATRIBUTOS) {
            valores[a.id] = 0;
        }
        for (let i = 0; i < REGRAS.pontosAtributo; i++) {
            const livres = ATRIBUTOS.filter(function (a) {
                return valores[a.id] < REGRAS.maxPorAtributo;
            });
            const escolhido = this.sorteio.item(livres);
            valores[escolhido.id]++;
        }
        this.definirAtributos(valores);
    }

    // Atualiza contador de pontos, botões + e − e a prévia da ficha
    atualizar() {
        const atributos = this.lerAtributos();
        const restantes = REGRAS.pontosAtributo - Heroi.totalDePontos(atributos);

        const pontos = this.querySelector("[data-pontos]");
        pontos.textContent = restantes;
        if (restantes === 0) {
            pontos.dataset.estado = "completo";
        } else {
            pontos.dataset.estado = "pendente";
        }

        for (const botao of this.querySelectorAll("[data-passo]")) {
            const valor = atributos[botao.dataset.atributo];
            if (Number(botao.dataset.passo) > 0) {
                botao.disabled = restantes <= 0 || valor >= REGRAS.maxPorAtributo;
            } else {
                botao.disabled = valor <= 0;
            }
        }

        const classe = this.form.elements.classe.value;
        const botaoRecomendado = this.querySelector("[data-recomendado]");
        botaoRecomendado.disabled = classe === "";
        if (classe === "") {
            botaoRecomendado.title = "Escolha uma classe primeiro";
        } else {
            botaoRecomendado.title = "Distribui os pontos do jeito ideal para " + classe;
        }

        let descricao = "";
        if (classe !== "") {
            descricao = DADOS_HEROIS[classe].descricao;
        }
        this.querySelector("[data-descricao]").textContent = descricao;
        this.mostrarErro("");

        if (classe !== "") {
            const nome = this.form.elements.nome.value.trim() || "Seu herói";
            let selo = "Prévia";
            if (this.personagem !== null) {
                selo = "Prévia (ainda não criado)";
            }
            this.mostrarFicha(criarHeroi(nome, classe, atributos), selo);
        } else {
            this.saida.hidden = true;
        }
    }

    criar() {
        const nome = this.form.elements.nome.value.trim();
        const classe = this.form.elements.classe.value;
        const atributos = this.lerAtributos();

        let erro = null;
        if (nome === "") {
            erro = "Dê um nome ao seu herói.";
        } else if (classe === "") {
            erro = "Escolha uma classe.";
        } else {
            erro = Heroi.validarAtributos(atributos);
        }
        if (erro !== null) {
            this.mostrarErro(erro);
            return;
        }

        // Um herói novo começa do nível 1: confirma antes de perder o progresso
        const atual = this.personagem;
        if (atual !== null && atual.nivel > 1) {
            const continuar = confirm("Criar um novo herói substitui " + atual.nome + " (nível " + atual.nivel + ") e o progresso será perdido. Continuar?");
            if (!continuar) {
                return;
            }
        }

        this.personagem = criarHeroi(nome, classe, atributos);
        this.salvar();
        this.mostrarFicha(this.personagem, "Herói criado", this.linkProximoPasso());
    }

    // Recarrega o último herói salvo (com o nível e o XP ganhos nas batalhas)
    restaurarSalvo() {
        const personagem = Heroi.carregar(armazenamento.ler(CHAVE_HEROI_SALVO));
        if (personagem === null) {
            return;
        }

        this.form.elements.nome.value = personagem.nome;
        this.form.elements.classe.value = personagem.classe;
        this.definirAtributos(personagem.atributos);
        this.atualizar();

        this.personagem = personagem;
        this.mostrarFicha(personagem, "Herói salvo", this.linkProximoPasso());
    }

    linkProximoPasso() {
        return '<a class="link-passo" href="monstro.html">Próximo passo: gerar um monstro ➜</a>';
    }

    salvar() {
        armazenamento.salvar(CHAVE_HEROI_SALVO, this.personagem.paraSalvar());
    }

    mostrarFicha(personagem, selo, extra = "") {
        this.saida.hidden = false;
        this.saida.innerHTML = Ficha.html(personagem, selo) + extra;
    }

    mostrarErro(mensagem) {
        this.querySelector("[data-erro]").textContent = mensagem;
    }

    mostrarDica(texto) {
        this.dica.hidden = texto === "";
        this.dica.textContent = texto;
    }
}

customElements.define("criador-personagem", CriadorPersonagem);
