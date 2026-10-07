// =====================================================================
// <menu-rpg> - barra de navegação usada nas três páginas.
// Basta colocar <menu-rpg></menu-rpg> no HTML; a página atual fica destacada.
// A ordem é a ordem do jogo: criar o herói, gerar o monstro e lutar.
// =====================================================================

class MenuRpg extends HTMLElement {
    connectedCallback() {
        const paginas = [
            { arquivo: "index.html", nome: "1. Personagem" },
            { arquivo: "monstro.html", nome: "2. Monstro" },
            { arquivo: "batalha.html", nome: "3. Batalha" }
        ];

        // Nome do arquivo aberto agora (endereço terminando em "/" = index.html)
        let atual = location.pathname.split("/").pop();
        if (atual === "") {
            atual = "index.html";
        }
        atual = decodeURIComponent(atual).toLowerCase();

        let links = "";
        for (const pagina of paginas) {
            let destaque = "";
            if (pagina.arquivo.toLowerCase() === atual) {
                destaque = ' aria-current="page"';
            }
            links += '<a href="' + pagina.arquivo + '"' + destaque + ">" + pagina.nome + "</a>";
        }

        this.innerHTML = '<nav class="menu" aria-label="Páginas do jogo">' + links + "</nav>";
    }
}

customElements.define("menu-rpg", MenuRpg);

// Ao usar o botão "Voltar", o navegador pode mostrar a página guardada na
// memória, com o herói ou o monstro antigo. Nesse caso, recarrega a página
// para ler de novo o que está salvo.
window.addEventListener("pageshow", function (evento) {
    if (evento.persisted) {
        location.reload();
    }
});
