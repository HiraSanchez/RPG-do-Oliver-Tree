// =====================================================================
// FICHA - monta o HTML da ficha de qualquer Combatente.
// A mesma função serve para herói e monstro: cada classe responde
// getTitulo(), getForteContra()... do seu jeito (polimorfismo).
// =====================================================================

const Ficha = {
    html: function (combatente, selo = "") {
        // Uma linha "Nome: valor" da ficha (sem os efeitos de batalha)
        function linha(estatistica, sufixo = "") {
            const valor = Math.round(Math.min(combatente.getStatBase(estatistica), limiteEstatistica(estatistica)) * 100) / 100;
            return "<p><strong>" + ESTATISTICAS[estatistica] + ":</strong> " + valor + sufixo + "</p>";
        }

        function lista(itens) {
            if (itens.length === 0) {
                return '<li class="vazio">Nenhum</li>';
            }
            let html = "";
            for (const item of itens) {
                html += "<li>" + escaparHtml(item) + "</li>";
            }
            return html;
        }

        // Barra de XP: só heróis têm experiência
        let barraXp = "";
        if (combatente instanceof Heroi) {
            const progresso = combatente.getProgresso();
            if (progresso.necessario === 0) {
                barraXp = '<p class="xp-texto">Nível máximo alcançado!</p>';
            } else {
                const porcentagem = (100 * progresso.xp) / progresso.necessario;
                barraXp = `
                    <div class="barra-xp" role="progressbar" aria-label="Experiência" aria-valuemin="0"
                         aria-valuemax="${progresso.necessario}" aria-valuenow="${progresso.xp}">
                        <span style="width: ${porcentagem}%"></span>
                    </div>
                    <p class="xp-texto">XP ${progresso.xp} / ${progresso.necessario} para o nível ${progresso.nivel + 1}</p>`;
            }
        }

        // Caixa da habilidade especial (só para quem tem)
        let caixaHabilidade = "";
        if (temHabilidadeEspecial(combatente)) {
            const h = combatente.habilidade;
            let passiva = "";
            if (combatente.getPassiva() !== "") {
                passiva = '<p class="passiva">Passiva: ' + combatente.getPassiva() + "</p>";
            }
            caixaHabilidade = `
                <h4>Habilidade especial</h4>
                <div class="caixa habilidade">
                    <p><strong>${h.nome}</strong>
                       <span class="custo">${h.custo} MP · a cada ${h.recarga} turnos</span></p>
                    <p>${h.descricao}</p>
                    ${passiva}
                </div>`;
        }

        let htmlSelo = "";
        if (selo !== "") {
            htmlSelo = '<span class="selo">' + selo + "</span>";
        }
        const categoria = combatente instanceof Monstro
            ? '<p>' + escaparHtml(combatente.getCategoria()) + ' · recompensa de XP ×' + combatente.getMultiplicadorXp() + '</p>' : '';
        const tiposUsados = combatente instanceof Heroi ? Heroi.tiposDeDano(combatente.classe) :
            Object.keys(TIPOS_DANO).filter(tipo => combatente.getStatBase(tipo) > 0);

        return `
            <article class="ficha">
                <div class="ficha-imagem">
                    <img src="${combatente.imagem}" alt="${escaparHtml(combatente.nome)}" loading="lazy" width="200" height="200">
                </div>
                <div class="ficha-detalhes">
                    ${htmlSelo}
                    <h3>${escaparHtml(combatente.getTitulo())}</h3>
                    ${categoria}
                    ${barraXp}

                    <div class="atributos-principais">
                        <div class="caixa">${linha("hp")}${linha("mp")}</div>
                        <div class="caixa">${linha("critico", "%")}${linha("esquiva", "%")}</div>
                    </div>

                    <h4>Dano</h4>
                    <div class="caixa grade">
                        ${tiposUsados.map(tipo => linha(tipo)).join("")}
                    </div>

                    <h4>Defesas</h4>
                    <div class="caixa grade">
                        ${linha("defesa")}${linha("defesaMagica")}${linha("resVeneno", "%")}${linha("resSagrado", "%")}
                    </div>

                    ${caixaHabilidade}

                    <div class="vantagens-grid">
                        <div class="caixa vantagem"><h5>Forte contra (+25% nos golpes diretos)</h5><ul>${lista(combatente.getForteContra())}</ul></div>
                        <div class="caixa desvantagem"><h5>Fraco contra</h5><ul>${lista(combatente.getFracoContra())}</ul></div>
                    </div>
                </div>
            </article>`;
    }
};
