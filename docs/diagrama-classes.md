# Diagrama de classes

Diagrama do núcleo e dos adaptadores de interface. Assinaturas secundárias foram omitidas. JavaScript usa contratos estruturais; as bases abstratas são protegidas por `new.target`.

```mermaid
classDiagram
    direction TB
    class Combatente {
        <<abstract>>
        -base
        -hp
        -mp
        -efeitos
        -recarga
        +receberDano(valor)
        +curar(valor)
        +gastarMp(valor)
        +getStat(nome)
        +getEfeitos() descricoesImutaveis
        +processarEfeitos(batalha)
        +iniciarRodada()
        +finalizarRodada(batalha)
        +escolherAcao(batalha)*
    }
    class Heroi {
        <<abstract>>
        -atributos
        -xp
        +ganharXp(quantidade)
        +carregar(dados)$
        +calcularEstatisticas(classe, atributos, nivel)$
        +atributosUteis(classe)$
        +paraSalvar()
    }
    class Monstro {
        <<abstract>>
        +calcularXp(nivelDoHeroi)
        +getCategoria()
        +carregar(dados)$
        +paraSalvar()
    }
    Combatente <|-- Heroi
    Combatente <|-- Monstro
    Heroi <|-- Guerreiro
    Heroi <|-- Mago
    Heroi <|-- Arqueira
    Heroi <|-- Paladino
    Heroi <|-- Bardo
    Heroi <|-- Ladino
    Heroi <|-- Druida
    Heroi <|-- Barbaro
    Monstro <|-- Goblin
    Monstro <|-- Ogro
    Monstro <|-- Dragao
    Monstro <|-- Lich
    Monstro <|-- Minotauro
    Monstro <|-- Quimera
    Monstro <|-- Basilisco
    Monstro <|-- Manticora
    Monstro <|-- Hidra
    Monstro <|-- Gargula
    note for Goblin "Habilidade especial opcional (ISP)"
    class Efeito {
        <<abstract>>
        -restante
        +relogio
        +aoIniciarTurno(alvo, batalha)
        +passarTurno()
        +bonus(nome)
        +bonusPercentual(nome)
        +impedeAcao()
    }
    Combatente *-- Efeito
    Efeito <|-- EfeitoDeDano
    Efeito <|-- EfeitoDeCura
    Efeito <|-- EfeitoDeAtributo
    Efeito <|-- Inspirado
    Efeito <|-- Atordoado
    Efeito <|-- Defendendo
    EfeitoDeDano <|-- Envenenado
    EfeitoDeDano <|-- Queimando
    EfeitoDeCura <|-- Bencao
    EfeitoDeCura <|-- Regeneracao
    EfeitoDeAtributo <|-- MiraPrecisa
    EfeitoDeAtributo <|-- Furia
    EfeitoDeAtributo <|-- FormaDePedra
    EfeitoDeAtributo <|-- Petrificado
    class Acao {
        <<abstract>>
        +podeExecutar(ator, batalha)
        +executar(ator, alvo, batalha)*
    }
    Acao <|-- Atacar
    Acao <|-- UsarHabilidade
    Acao <|-- Defender
    Acao <|-- UsarPocao
    class Batalha {
        +jogarTurno(acao)
        +simular()
        +golpear(atacante, defensor, tipo, multiplicador)
        +aplicarEfeito(alvo, efeito, chance)
        +verificarFim()
    }
    class Inventario {
        -itens
        +quantidade(id)
        +adicionar(id, quantidade)
        +consumir(id)
    }
    class Recompensas {
        +entregar(heroi, monstro)
    }
    Batalha --> Combatente : participantes
    Batalha --> Acao : registro injetado
    Batalha --> CalculadoraDeDano : recebe
    Batalha --> Inventario : recebe
    Batalha --> Recompensas : recebe
    Batalha --> Narrador : recebe
    Batalha --> Sorteio : recebe
    Recompensas --> Heroi : entrega XP
    Recompensas --> Monstro : consulta recompensa
    Narrador --> MensagensPtBr
    Narrador --> SaidaNaTela
    Narrador --> SaidaNoConsole
    Narrador ..> SaidaEmLista : testes
    Sorteio <|-- SorteioFixo
    Sorteio <|-- SorteioSeed
    class criarBatalha {
        <<function>>
    }
    criarBatalha ..> Batalha : compoe dependencias
    ArenaBatalha ..> criarBatalha
    class Terminal {
        <<module>>
    }
    Terminal ..> criarBatalha
    Terminal ..> Heroi
    Terminal ..> Monstro
    HTMLElement <|-- ArenaBatalha
    HTMLElement <|-- CriadorPersonagem
    HTMLElement <|-- GeradorMonstro
    HTMLElement <|-- MenuRpg
    CriadorPersonagem ..> Heroi
    GeradorMonstro ..> Monstro
    CriadorPersonagem ..> Ficha
    GeradorMonstro ..> Ficha
    Ficha ..> Combatente
```

`criarBatalha` é uma função de composição, não uma classe; `Terminal` representa `rpg.cjs`. `SorteioFixo` e `SaidaEmLista` estão nos testes; `SorteioSeed` está no simulador. As saídas do narrador implementam o contrato `escrever(chave, texto)`, sem superclasse obrigatória.

Veja no [README](README.md#6-onde-os-princípios-solid-aparecem) a relação entre os princípios e o código. Tipos novos exigem registro nos dados/fábricas; ações novas são injetadas sem editar `Batalha`.
