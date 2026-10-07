// =====================================================================
// <arena-batalha> - a tela da luta (passo 3): cartões, barras de HP/MP,
// botões e log. Só cuida da TELA; as regras ficam na classe Batalha.
// Pega o herói e o monstro salvos nas páginas anteriores.
// =====================================================================

class ArenaBatalha extends HTMLElement {
    connectedCallback() {
        if (this.painel) {
            return; // já foi montado
        }

        const reducaoDefesa = Math.round(REGRAS.reducaoDefendendo * 100);
        const mpDefesa = Math.round(REGRAS.mpAoDefender * 100);
        const curaPocao = Math.round(REGRAS.curaPocao * 100);

        this.innerHTML = `
            <p class="arena-aviso" data-aviso></p>
            <div class="arena" data-painel hidden>
                <div class="combatentes">
                    <div class="cartao" data-cartao="heroi"></div>
                    <div class="versus" aria-hidden="true">VS</div>
                    <div class="cartao" data-cartao="monstro"></div>
                </div>

                <div class="acoes-batalha">
                    <button type="button" data-acao="atacar" data-atalho="1" title="Ataque básico da sua classe (tecla 1)">Atacar</button>
                    <button type="button" data-acao="habilidade" data-atalho="2">Habilidade</button>
                    <button type="button" data-acao="defender" data-atalho="3" title="Reduz o próximo dano em ${reducaoDefesa}% e recupera ${mpDefesa}% do MP (tecla 3)">Defender</button>
                    <button type="button" data-acao="pocao" data-atalho="4" title="Recupera ${curaPocao}% do HP máximo (tecla 4)">Poção</button>
                </div>
                <p class="atalhos-dica">Atalhos: teclas 1 a 4 para as ações.</p>
                <div class="acoes-secundarias">
                    <button type="button" class="botao-secundario" data-auto>Batalha automática</button>
                    <button type="button" class="botao-secundario" data-reiniciar>Recomeçar</button>
                </div>

                <div class="resultado-batalha" data-resultado role="status" hidden></div>
                <div class="battle-log" data-log aria-live="polite"></div>
                <p class="arena-links">
                    <a href="index.html">Trocar de herói</a> ·
                    <a href="monstro.html">Escolher outro monstro</a>
                </p>
            </div>`;

        this.aviso = this.querySelector("[data-aviso]");
        this.painel = this.querySelector("[data-painel]");
        this.elementoResultado = this.querySelector("[data-resultado]");
        this.timerAuto = null;
        this.batalha = null;

        // O log da tela: o narrador escreve aqui
        this.saidaLog = new SaidaNaTela(this.querySelector("[data-log]"));

        // Herói e monstro salvos nas páginas de Personagem e Monstro
        this.personagem = Heroi.carregar(armazenamento.ler(CHAVE_HEROI_SALVO));
        this.monstro = Monstro.carregar(armazenamento.ler(CHAVE_MONSTRO_SALVO));

        this.addEventListener("click", (evento) => this.aoClicar(evento));
        document.addEventListener("keydown", (evento) => this.aoTeclar(evento));

        this.novaBatalha();
    }

    disconnectedCallback() {
        this.pararAuto();
    }

    novaBatalha() {
        this.pararAuto();

        const faltando = [];
        if (this.personagem === null) {
            faltando.push('<a href="index.html">criar um personagem</a>');
        }
        if (this.monstro === null) {
            faltando.push('<a href="monstro.html">gerar um monstro</a>');
        }

        this.aviso.hidden = faltando.length === 0;
        this.aviso.innerHTML = "Para lutar, falta " + faltando.join(" e ") + ".";
        this.painel.hidden = faltando.length > 0;
        if (faltando.length > 0) {
            this.batalha = null;
            return;
        }

        // Aqui as dependências são montadas e entregues prontas para a Batalha
        this.saidaLog.limpar();
        const narrador = new Narrador(new MensagensPtBr(), this.saidaLog);
        this.batalha = new Batalha(this.personagem, this.monstro, narrador, new Sorteio());

        this.montarCartao("heroi", this.personagem);
        this.montarCartao("monstro", this.monstro);
        this.renderizar();
    }

    // ---------- Controles ----------

    aoClicar(evento) {
        const botao = evento.target.closest("button");
        if (!botao || botao.disabled || this.batalha === null) {
            return;
        }

        if (botao.dataset.acao) {
            this.jogar(botao.dataset.acao);
        } else if (botao.hasAttribute("data-auto")) {
            if (this.timerAuto === null) {
                this.iniciarAuto();
            } else {
                this.pararAuto();
            }
        } else if (botao.hasAttribute("data-reiniciar")) {
            this.novaBatalha();
        }
        this.renderizar();
    }

    // Teclas 1 a 4 apertam os botões de ação (menos quando está digitando)
    aoTeclar(evento) {
        if (this.batalha === null || this.painel.hidden) {
            return;
        }
        if (evento.ctrlKey || evento.altKey || evento.metaKey) {
            return;
        }
        if (evento.target.closest && evento.target.closest("input, select, textarea")) {
            return;
        }

        const botao = this.querySelector('[data-atalho="' + evento.key + '"]');
        if (botao !== null && !botao.disabled) {
            evento.preventDefault();
            botao.click();
        }
    }

    jogar(nomeDaAcao) {
        this.batalha.jogarTurno(nomeDaAcao);
        if (this.batalha.terminou()) {
            this.pararAuto();
            // Ganhou: salva o XP (e o nível novo) do herói
            if (this.batalha.resultado === "vitoria") {
                armazenamento.salvar(CHAVE_HEROI_SALVO, this.personagem.paraSalvar());
                this.querySelector('[data-cartao="heroi"] h3').textContent = this.personagem.getTitulo();
            }
        }
        this.renderizar();
    }

    iniciarAuto() {
        this.timerAuto = setInterval(() => this.jogar(null), 600);
    }

    pararAuto() {
        clearInterval(this.timerAuto);
        this.timerAuto = null;
    }

    // ---------- Desenho na tela ----------

    montarCartao(lado, combatente) {
        function barra(tipo) {
            return `
                <div class="barra barra-${tipo}" data-barra="${tipo}" role="progressbar" aria-label="${tipo.toUpperCase()}" aria-valuemin="0">
                    <span class="barra-preenchimento"></span>
                    <span class="barra-texto"></span>
                </div>`;
        }

        const cartao = this.querySelector('[data-cartao="' + lado + '"]');
        cartao.className = "cartao";
        cartao.dataset.hp = combatente.getHp();
        cartao.innerHTML = `
            <img class="cartao-imagem" src="${combatente.imagem}" alt="" width="120" height="120">
            <h3>${escaparHtml(combatente.getTitulo())}</h3>
            ${barra("hp")}
            ${barra("mp")}
            <ul class="efeitos" data-efeitos></ul>`;
    }

    atualizarBarra(cartao, tipo, atual, maximo) {
        let porcentagem = 0;
        if (maximo > 0) {
            porcentagem = (100 * atual) / maximo;
        }
        const barra = cartao.querySelector('[data-barra="' + tipo + '"]');
        barra.querySelector(".barra-preenchimento").style.width = porcentagem + "%";
        barra.querySelector(".barra-texto").textContent = tipo.toUpperCase() + " " + atual + " / " + maximo;
        barra.setAttribute("aria-valuemax", maximo);
        barra.setAttribute("aria-valuenow", atual);
        if (tipo === "hp") {
            barra.classList.toggle("critica", porcentagem <= 30);
        }
    }

    atualizarCartao(lado, combatente) {
        const cartao = this.querySelector('[data-cartao="' + lado + '"]');

        this.atualizarBarra(cartao, "hp", combatente.getHp(), combatente.getHpMaximo());
        this.atualizarBarra(cartao, "mp", combatente.getMp(), combatente.getMpMaximo());

        let efeitos = "";
        for (const efeito of combatente.getEfeitos()) {
            efeitos += '<li class="efeito efeito-' + efeito.tipo + '">' + efeito.nome + " · " + efeito.restante + "</li>";
        }
        cartao.querySelector("[data-efeitos]").innerHTML = efeitos;

        // Tremidinha quando leva dano
        if (combatente.getHp() < Number(cartao.dataset.hp)) {
            cartao.classList.remove("atingido");
            void cartao.offsetWidth; // truque para reiniciar a animação do CSS
            cartao.classList.add("atingido");
        }
        cartao.dataset.hp = combatente.getHp();
        cartao.classList.toggle("derrotado", !combatente.estaVivo());
    }

    renderizar() {
        const batalha = this.batalha;
        if (batalha === null) {
            return;
        }
        const heroi = batalha.heroi;
        const terminou = batalha.terminou();

        this.atualizarCartao("heroi", heroi);
        this.atualizarCartao("monstro", batalha.monstro);

        const emAuto = this.timerAuto !== null;
        const bloqueado = terminou || emAuto;

        this.querySelector('[data-acao="atacar"]').disabled = bloqueado;
        this.querySelector('[data-acao="defender"]').disabled = bloqueado;

        const botaoHabilidade = this.querySelector('[data-acao="habilidade"]');
        botaoHabilidade.disabled = bloqueado || !heroi.podeUsarHabilidade();
        const h = heroi.habilidade;
        if (heroi.getRecarga() > 1) {
            botaoHabilidade.textContent = h.nome + " (em " + heroi.getRecarga() + " turnos)";
        } else if (heroi.getRecarga() === 1) {
            botaoHabilidade.textContent = h.nome + " (em 1 turno)";
        } else {
            botaoHabilidade.textContent = h.nome + " (" + h.custo + " MP)";
        }
        botaoHabilidade.title = h.descricao;

        const botaoPocao = this.querySelector('[data-acao="pocao"]');
        botaoPocao.disabled = bloqueado || batalha.pocoes === 0;
        botaoPocao.textContent = "Poção (" + batalha.pocoes + ")";

        const botaoAuto = this.querySelector("[data-auto]");
        botaoAuto.disabled = terminou;
        if (emAuto) {
            botaoAuto.textContent = "Pausar";
        } else {
            botaoAuto.textContent = "Batalha automática";
        }

        const botaoReiniciar = this.querySelector("[data-reiniciar]");
        if (terminou) {
            botaoReiniciar.textContent = "Lutar novamente";
        } else {
            botaoReiniciar.textContent = "Recomeçar";
        }

        this.elementoResultado.hidden = !terminou;
        if (terminou) {
            this.mostrarResultado(batalha);
        }
    }

    mostrarResultado(batalha) {
        const titulos = { vitoria: "Vitória!", derrota: "Derrota...", empate: "Empate" };
        const meu = batalha.placar.heroi;
        const dele = batalha.placar.monstro;

        let recompensa = "";
        if (batalha.resultado === "vitoria") {
            if (batalha.recompensaXp === 0) {
                recompensa = "Nível máximo — sem XP";
            } else {
                recompensa = "+" + batalha.recompensaXp + " XP";
            }
            if (batalha.niveisGanhos > 0) {
                recompensa += " · Subiu para o nível " + batalha.heroi.nivel + "!";
            }
            recompensa = '<span class="resultado-recompensa">' + recompensa + "</span>";
        }

        this.elementoResultado.className = "resultado-batalha " + batalha.resultado;
        this.elementoResultado.innerHTML = `
            <strong class="resultado-titulo">${titulos[batalha.resultado]}</strong>
            ${recompensa}
            <dl class="resumo">
                <div><dt>Turnos</dt><dd>${Math.min(batalha.turno, REGRAS.limiteTurnos)}</dd></div>
                <div><dt>Dano causado</dt><dd>${meu.dano}</dd></div>
                <div><dt>Dano recebido</dt><dd>${dele.dano}</dd></div>
                <div><dt>Críticos</dt><dd>${meu.criticos}</dd></div>
                <div><dt>Esquivas</dt><dd>${meu.esquivas}</dd></div>
                <div><dt>Poções usadas</dt><dd>${REGRAS.pocoesPorBatalha - batalha.pocoes}</dd></div>
            </dl>`;
    }
}

customElements.define("arena-batalha", ArenaBatalha);
