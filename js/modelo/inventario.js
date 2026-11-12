// A batalha recebe seu inventário pronto; itens não são campos soltos do motor.
class Inventario {
    #itens = new Map();

    constructor(itens = {}) {
        for (const [id, quantidade] of Object.entries(itens)) this.adicionar(id, quantidade);
    }

    quantidade(id) { return this.#itens.get(id) ?? 0; }

    adicionar(id, quantidade = 1) {
        if (typeof id !== "string" || !id || !Number.isSafeInteger(quantidade) || quantidade < 0) {
            throw new RangeError("Item ou quantidade inválida.");
        }
        const total = this.quantidade(id) + quantidade;
        if (!Number.isSafeInteger(total)) throw new RangeError("Inventário excedeu o limite.");
        this.#itens.set(id, total);
    }

    consumir(id) {
        if (this.quantidade(id) === 0) return false;
        this.#itens.set(id, this.quantidade(id) - 1);
        return true;
    }
}
