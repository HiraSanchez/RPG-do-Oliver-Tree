// =====================================================================
// COMBATENTE - classe base (abstrata) de tudo que luta.
// Heroi (herois.js) e Monstro (monstros.js) herdam desta classe.
// HP, MP, efeitos e leitura das estatísticas ficam aqui, uma vez só.
// =====================================================================

class Combatente {
    // Campos privados (encapsulamento): só podem ser mudados pelos métodos
    // desta classe, por exemplo receberDano(), curar() e iniciarRecarga().
    #base;
    #hp;
    #mp;
    #efeitos;
    #recarga; // turnos até a habilidade poder ser usada de novo

    constructor(nome, imagem, nivel, estatisticas, ataqueBasico) {
        // Não faz sentido existir um "Combatente" genérico, só Heróis e Monstros
        if (new.target === Combatente) {
            throw new Error("Combatente é uma classe abstrata. Crie um Heroi ou um Monstro.");
        }
        this.nome = nome;
        this.imagem = imagem;
        this.nivel = nivel;
        this.ataqueBasico = ataqueBasico; // "fisico", "magico", "veneno" ou "sagrado"
        this.definirEstatisticas(estatisticas);
        this.#hp = this.#base.hp;
        this.#mp = this.#base.mp;
        this.#efeitos = [];
        this.#recarga = 0;
    }

    // Guarda as estatísticas, colocando 0 nas que não foram informadas
    definirEstatisticas(estatisticas) {
        this.#base = {};
        for (const nome in ESTATISTICAS) {
            if (estatisticas[nome] === undefined) {
                this.#base[nome] = 0;
            } else {
                this.#base[nome] = estatisticas[nome];
            }
        }
        // se o HP máximo diminuir, o HP atual acompanha
        if (this.#hp > this.#base.hp) {
            this.#hp = this.#base.hp;
        }
    }

    // ---------- HP e MP ----------

    getHp() {
        return this.#hp;
    }

    getMp() {
        return this.#mp;
    }

    getHpMaximo() {
        return this.#base.hp;
    }

    getMpMaximo() {
        return this.#base.mp;
    }

    estaVivo() {
        return this.#hp > 0;
    }

    // Os métodos abaixo devolvem quanto realmente mudou (usado no log)
    receberDano(valor) {
        const dano = Math.min(this.#hp, Math.round(valor));
        this.#hp = this.#hp - dano;
        return dano;
    }

    curar(valor) {
        const cura = Math.min(this.getHpMaximo() - this.#hp, Math.round(valor));
        this.#hp = this.#hp + cura;
        return cura;
    }

    recuperarMp(valor) {
        const recuperado = Math.min(this.getMpMaximo() - this.#mp, Math.round(valor));
        this.#mp = this.#mp + recuperado;
        return recuperado;
    }

    gastarMp(valor) {
        const gasto = Math.min(this.#mp, Math.round(valor));
        this.#mp = this.#mp - gasto;
        return gasto;
    }

    // Antes de cada luta: vida e MP cheios, sem efeitos e sem recarga
    prepararParaBatalha() {
        this.#hp = this.getHpMaximo();
        this.#mp = this.getMpMaximo();
        this.#efeitos = [];
        this.#recarga = 0;
    }

    // ---------- Estatísticas ----------

    // Valor sem os efeitos (é o que aparece na ficha)
    getStatBase(nome) {
        if (this.#base[nome] === undefined) {
            return 0;
        }
        return this.#base[nome];
    }

    // Valor atual, somando os bônus e penalidades dos efeitos ativos.
    // Os efeitos não mudam a base, então nada fica "preso" quando acabam.
    getStat(nome) {
        let valor = this.getStatBase(nome);
        let percentual = 0;
        for (const efeito of this.#efeitos) {
            valor = valor + efeito.bonus(nome);
            percentual = percentual + efeito.bonusPercentual(nome);
        }
        return Math.max(0, valor * (1 + percentual / 100));
    }

    // ---------- Efeitos ----------

    // Devolve uma cópia da lista, para ninguém mexer nela por fora
    getEfeitos() {
        return this.#efeitos.slice();
    }

    temEfeito(id) {
        for (const efeito of this.#efeitos) {
            if (efeito.id === id) {
                return true;
            }
        }
        return false;
    }

    // Se o efeito já está ativo, só renova a duração (não acumula)
    adicionarEfeito(novoEfeito) {
        this.removerEfeito(novoEfeito.id);
        this.#efeitos.push(novoEfeito);
    }

    removerEfeito(id) {
        this.#efeitos = this.#efeitos.filter(function (efeito) {
            return efeito.id !== id;
        });
    }

    // ---------- Habilidade especial ----------

    podeUsarHabilidade() {
        if (!temHabilidadeEspecial(this)) {
            return false;
        }
        return this.#recarga === 0 && this.#mp >= this.habilidade.custo;
    }

    getRecarga() {
        return this.#recarga;
    }

    // Depois de usar a habilidade, ela fica alguns turnos sem poder ser usada
    iniciarRecarga() {
        this.#recarga = this.habilidade.recarga;
    }

    // Chamado no fim de cada turno
    diminuirRecarga() {
        if (this.#recarga > 0) {
            this.#recarga--;
        }
    }

    // ---------- Métodos que as subclasses sobrescrevem (polimorfismo) ----------

    getTitulo() {
        return this.nome;
    }

    // Só heróis têm classe (Guerreiro, Bardo...). Monstros respondem false.
    ehDaClasse(classe) {
        return false;
    }

    getForteContra() {
        return [];
    }

    getFracoContra() {
        return [];
    }

    // Texto da habilidade passiva (vazio = não tem)
    getPassiva() {
        return "";
    }

    // true se esta classe de herói tem vantagem contra mim
    temFraquezaContra(classe) {
        return false;
    }

    // Multiplicador de dano contra um alvo (vantagem de classe)
    multiplicadorContra(alvo) {
        return 1;
    }

    // Chamado no fim de cada turno (passivas, como a regeneração do Ogro)
    aoFimDoTurno(batalha) {
        // por padrão não faz nada
    }

    // Qual ação fazer quando a escolha é automática.
    // Devolve "atacar", "habilidade", "defender" ou "pocao".
    escolherAcao(batalha) {
        throw new Error("A classe " + this.constructor.name + " precisa implementar escolherAcao().");
    }
}


// Equivale ao "instanceof ComHabilidadeEspecial" do exemplo em Java.
// JavaScript não tem interface, então verificamos se o objeto tem o método.
// Assim um combatente sem habilidade não é obrigado a ter um método vazio (ISP).
function temHabilidadeEspecial(combatente) {
    return typeof combatente.usarHabilidade === "function";
}
