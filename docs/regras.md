# Regras de combate

## Atributos e nível

Cada herói distribui 30 pontos inteiros entre seis atributos, com limite de 10 por atributo. As fórmulas são específicas da classe. A ficha mostra os tipos de dano usados pela classe. O formulário informa ganhos por ponto no nível 1; arredondamentos podem fazer um ponto isolado não mudar imediatamente um número inteiro.

HP, dano e defesa física/mágica usam o valor de nível 1 arredondado, multiplicado por `1,1^(nível−1)`, com arredondamento final. MP e resistências permanecem constantes. Crítico/esquiva ganham 0,25 ponto percentual por nível adicional. Tetos: crítico 75%, esquiva 50%, resistência 75%. O modelo e a ficha respeitam os mesmos limites.

O nível aumenta o poder dos golpes sem remover fraquezas elementais ou tornar custos irrelevantes. Um atacante de nível superior também penetra melhor a armadura: a constante defensiva usa o nível dele.

## Rodada, ação e iniciativa

Uma **rodada** contém uma ação do herói e a resposta do monstro. Antes da ação, resolvem-se os efeitos do portador. Quem morrer nesse momento não age nem recebe cura de efeitos posteriores. Atordoamento faz perder uma ação, mas recarga, recuperação normal de MP e passivas avançam se o portador estiver vivo.

Ao terminar a ação, a recarga diminui em 1, o MP recupera 5% do máximo (mínimo 2, limitado ao máximo) e a passiva é processada. Intervalo 2 permite usar habilidade nas ações 1, 3, 5; intervalo 3, nas ações 1, 4, 7. O botão mostra quantas ações intermediárias faltam.

A batalha começa com HP/MP cheios, sem efeitos/recarga e com três poções. Termina após uma morte ou empata após 50 rodadas. São encontros independentes de arena, sem custo persistente de derrotas.

## Golpes diretos

Primeiro se sorteia a esquiva. Se acertar, sorteiam-se crítico e variação de dano de ±10%. O crítico multiplica o dano por 1,75. O dano base é a estatística ofensiva vezes o coeficiente da habilidade. Vantagem sobre o alvo aplica multiplicador 1,25; não reduz dano recebido nem garante vitória.

- **Físico/mágico:** multiplicar por `K / (defesa + K)`, com `K = 50 × 1,1^(nível do atacante − 1)` e a defesa correspondente.
- **Veneno/espiritual:** ignoram armadura e multiplicam por `1 − resistência/100`.
- **Defender:** multiplica todos os golpes diretos por 0,5 até o início da próxima ação do defensor. Vale para os três golpes da Quimera. Restaura 15% do MP, além da recuperação normal.
- Dano direto é arredondado, com mínimo 1; o placar registra apenas HP efetivamente removido.

Bônus fixos de crítico são **pontos percentuais**: 15% +30 pontos = 45%, antes do teto. Bônus percentual de defesa é relativo: a Fúria transforma 20 de defesa em 26.

## Efeitos, duração e renovação

| Efeito | Resolução |
|---|---|
| Veneno | Três ticks no início das próximas ações do alvo. Resistência a veneno dá chance de impedir a aplicação; após aplicado, cada tick causa o valor fixo. |
| Queimadura | Dois ticks fixos no início das próximas ações do alvo. |
| Bênção/Regeneração | Cura nas próximas três ações, limitada ao HP máximo. |
| Inspirado | Recupera MP nas próximas três ações; o bônus de crítico cobre a aplicação e as duas ações seguintes. |
| Mira/Fúria | Bônus desde a ação de aplicação, cobrindo essa ação e as duas seguintes. Expira antes da quarta. |
| Forma de Pedra | Defesa aumentada até o início da segunda ação seguinte da Gárgula, cobrindo duas oportunidades de ataque do herói. |
| Petrificado | Resistência a veneno −30% relativos e esquiva −50% relativos, por três rodadas completas depois da aplicação. Expira no fim da terceira, após a resposta do monstro. |
| Atordoado | Impede exatamente a próxima ação e desaparece. |

Efeitos do mesmo identificador não acumulam: a reaplicação substitui o efeito e reinicia sua duração. Renovar um debuff durante a rodada não desconta a duração nova naquele encerramento.

Veneno e queimadura são **dano periódico fixo**: não têm crítico, esquiva, variação, bônus de vantagem ou mitigação de Defender. A resistência ao veneno é verificada apenas na aplicação, sem segunda redução nos ticks. Queimadura não tem esse teste. Isso preserva o papel dos efeitos contra armadura alta e evita aplicar resistência duas vezes.

## Poções, habilidades e estratégias

Poções pertencem ao inventário da batalha e curam 35% do HP máximo, gastando a ação. Só o herói as utiliza. A habilidade consome MP mesmo quando o golpe é esquivado; efeitos de suporte próprios podem ocorrer mesmo se o ataque errar.

No automático, o herói usa poção abaixo de 35% de HP, depois prioriza habilidade disponível e finalmente ataque básico. O monstro tenta usar habilidade em 70% das oportunidades disponíveis. Goblin sempre ataca.

Essa política não promete a melhor jogada. Curar antes de um golpe forte, escolher o momento de Defender e ajustar atributos para o inimigo podem melhorar o resultado. Não há garantia universal de vitória.

## Experiência e recompensas

XP para subir: `100 × nível atual`. A recompensa é `35 × nível do monstro × fator de diferença × fator do tipo`, arredondada e com mínimo 1. O fator de diferença é `1 + 0,25 × (nível do monstro − nível do herói)`, limitado entre 0,25 e 2.

| Monstro | Categoria | Fator do tipo |
|---|---|---:|
| Goblin | Comum | 0,45 |
| Ogro / Mantícora | Elite | 1,10 |
| Minotauro / Quimera / Gárgula | Elite | 1,20 |
| Basilisco | Elite | 1,30 |
| Lich / Hidra | Chefe | 1,30 |
| Dragão | Chefe | 1,60 |

Categorias indicam o papel e a recompensa, não um ranking absoluto para toda classe. Subir de nível aumenta máximos; a cura completa ocorre na próxima batalha. No nível 20 não há mais XP. Verificar o fim da mesma batalha repetidamente não duplica a recompensa.
