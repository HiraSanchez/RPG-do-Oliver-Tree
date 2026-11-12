# RPG do Oliver Tree

RPG por turnos desenvolvido em JavaScript, com versões para navegador e terminal. Este repositório reúne a evolução do projeto e sua adaptação para o trabalho de Paradigmas de Programação da faculdade.

## 1. Contextualização e histórico

Este RPG não foi desenvolvido do zero para o trabalho atual. O projeto começou em 2023, durante meu curso Técnico em Análise e Desenvolvimento de Sistemas, quando eu e meu grupo desenvolvemos sua primeira versão.

Depois disso, fiquei um bom tempo sem mexer nele. Recentemente, por causa deste trabalho da faculdade, resolvi retomar o projeto, aproveitando a estrutura e as funcionalidades que já estavam praticamente prontas. Nesta etapa, meu objetivo principal foi adaptar o código aos requisitos da atividade, principalmente trabalhando os princípios SOLID, a herança e o polimorfismo.

Também houve melhorias e expansões nas batalhas. A versão original tinha quatro personagens e quatro monstros, com níveis que chegavam, no máximo, ao nível 3. A versão atual tem oito classes de personagem, dez tipos de monstro e progressão do herói até o nível 20. Essa expansão aumentou as possibilidades do jogo e tornou o balanceamento mais complexo.

## 2. Utilização de inteligência artificial

Utilizei IA como ferramenta de apoio, principalmente para revisar o código, identificar possíveis erros e auxiliar no balanceamento das batalhas. Com mais personagens, monstros e níveis, também foi necessário comparar os resultados por meio de simulações.

Na revisão atual, esse apoio incluiu a implementação de correções e refatorações, a criação de testes e a adaptação para execução no terminal. A IA também está sendo utilizada para organizar esta documentação e conferir se as explicações correspondem ao código existente. Esse apoio faz parte da etapa atual de revisão e ampliação do projeto iniciado em 2023.

## 3. Como executar

### No terminal

É necessário ter **Node.js 22 ou superior**. Na pasta do projeto, execute:

```sh
node rpg.cjs
```

Escolha o nome, a classe, os atributos e o monstro. Durante a batalha, use `1` para atacar, `2` para habilidade, `3` para defender e `4` para poção. A opção `a` resolve o restante da batalha automaticamente; `0` sai. Se uma ação estiver indisponível, o terminal permite escolher outra sem gastar o turno.

O progresso fica em `.rpg-save.json`, que não é enviado ao Git. Ao abrir o jogo novamente, é possível continuar com o herói salvo. Para ver uma demonstração reproduzível, sem salvar progresso:

```sh
node rpg.cjs --demo
```

### No navegador

Abra `index.html` no Chrome ou Edge. Não é necessário instalar dependências nem iniciar um servidor. O fluxo é: **criar personagem → escolher monstro → batalhar**. As teclas `1` a `4` também executam as ações.

O navegador usa `localStorage` para guardar o progresso, separado do arquivo usado pelo terminal. Se o armazenamento estiver bloqueado, o jogo informa a falha.

[Versão hospedada](https://rpg-do-oliver-tree.onrender.com). As alterações locais só aparecem nessa versão depois de publicadas.

### Publicação no Render

A versão web é um site estático: as regras são executadas no navegador. No Render, conecte o repositório como **Static Site**, com **Build Command** `npm run build` e **Publish Directory** `dist`. O arquivo [render.yaml](../render.yaml) contém essa configuração para quem usar um Blueprint, conforme a [documentação do Render](https://render.com/docs/blueprint-spec).

O build não precisa instalar dependências. Ele gera `dist/` com as três páginas do jogo, CSS, JavaScript e imagens. Essa pasta é recriada a cada build e não deve ser enviada ao Git. O comando `npm start` abre o jogo no terminal; não inicia um servidor web.

Para a entrega da faculdade, mantenha também o terminal, os testes, o diagrama e a documentação presentes no repositório. Arquivos temporários, dependências locais de testes e simulações geradas ficam em `tmp/`, ignorada pelo Git.

## 4. Organização do projeto

A parte visual e a entrada de comandos ficam separadas das regras. Assim, navegador e terminal utilizam o mesmo sistema de combate.

| Arquivo ou pasta | Responsabilidade |
|---|---|
| `rpg.cjs` | Recebe as escolhas pelo terminal e salva o personagem em arquivo. |
| `index.html`, `monstro.html` e `batalha.html` | Páginas de criação, escolha do inimigo e combate. |
| `js/dados.js` | Guarda `REGRAS`, fórmulas dos heróis, estatísticas dos monstros e distribuições sugeridas de atributos. |
| `js/modelo/` | Contém `Combatente`, `Heroi`, `Monstro`, suas subclasses, os efeitos e o inventário. |
| `js/batalha/` | Reúne o controle da batalha, ações, cálculo de dano, recompensas, narração e criação das dependências. |
| `js/telas/` | Componentes do navegador, como `CriadorPersonagem`, `GeradorMonstro`, `ArenaBatalha` e `Ficha`. |
| `js/util.js` | Contém `Sorteio`, validações auxiliares e acesso ao armazenamento do navegador. |
| `js/testes.js` e `scripts/` | Testes e ferramentas de simulação. `scripts/carregar-jogo.cjs` carrega as mesmas regras no Node. |
| `docs/` | README, regras detalhadas e diagrama de classes. |
| `render.yaml` e `scripts/publicar.cjs` | Configuração do Render e preparação dos arquivos para publicação em `dist/`. |

O [diagrama de classes](diagrama-classes.md) mostra os relacionamentos entre essas partes.

## 5. Como o código funciona

### Personagens, monstros e herança

A classe [Combatente](../js/modelo/combatente.js) reúne o que heróis e monstros têm em comum: HP, MP, estatísticas, efeitos e recarga. Métodos como `receberDano()`, `curar()` e `getStat()` são reaproveitados pelas subclasses.

A herança está organizada assim:

```text
Combatente
├── Heroi
│   ├── Guerreiro
│   ├── Mago
│   ├── Paladino
│   └── demais classes de herói
└── Monstro
    ├── Goblin
    ├── Ogro
    ├── Dragao
    └── demais tipos de monstro
```

[Heroi](../js/modelo/herois.js) acrescenta atributos e experiência. `calcularEstatisticas()` transforma os pontos distribuídos em valores de combate usando as fórmulas de `DADOS_HEROIS`. `ganharXp()` controla a subida de nível e recalcula as estatísticas. A função `criarHeroi()` consulta `CLASSES_HEROIS` para instanciar a classe escolhida.

[Monstro](../js/modelo/monstros.js) usa `DADOS_MONSTROS` para calcular as estatísticas pelo nível. Também fornece vantagens, fraquezas e recompensa por meio de métodos como `multiplicadorContra()` e `calcularXp()`. `criarMonstro()` faz a associação entre o nome escolhido e a classe concreta.

Isso evita repetir o controle de vida em cada personagem. Um `Guerreiro` é um `Heroi` e também um `Combatente`, mas sua habilidade fica na própria classe.

Também há composição: um `Combatente` mantém objetos de efeito, e a `Batalha` utiliza ações e um inventário. Nesses casos, os objetos trabalham juntos sem precisar herdar uns dos outros.

### Abstração e encapsulamento

`Combatente`, `Heroi`, `Monstro`, `Efeito` e `Acao` são bases abstratas: seus construtores usam `new.target` para impedir a criação direta dessas classes. No jogo, são criados objetos concretos, como `Guerreiro` e `Goblin`.

Campos como `#hp`, `#mp` e `#recarga` são privados. Para causar dano, o código chama `receberDano(valor)`, que rejeita valores negativos ou não finitos e limita a perda à vida disponível. `Heroi` também mantém XP e atributos em campos privados. Isso concentra as alterações de estado em métodos que verificam as regras.

`getEfeitos()` devolve descrições imutáveis dos efeitos para a interface, sem expor os objetos internos. Isso não significa que todos os campos do projeto sejam privados: nome e nível, por exemplo, continuam públicos.

### Habilidades e polimorfismo

Em [acoes.js](../js/batalha/acoes.js), `UsarHabilidade.executar()` desconta MP, inicia a recarga e chama:

```js
ator.usarHabilidade(alvo, batalha);
```

Essa chamada é a mesma, mas o resultado depende do objeto. Em `Guerreiro`, o método contém:

```js
batalha.golpearComHabilidade(this, alvo, "fisico", 1.8);
```

Já `Mago.usarHabilidade()` causa dano mágico com multiplicador 2 e, se acertar e o alvo sobreviver, aplica `Queimando`. `Paladino.usarHabilidade()` aplica `Bencao` em si mesmo e causa dano espiritual.

Esse é o polimorfismo usado no combate: a ação chama um método comum, e cada classe executa sua implementação. A batalha não precisa de um `if` para cada nome de herói.

O mesmo acontece com os [efeitos](../js/modelo/efeitos.js). `Combatente.processarEfeitos()` chama `aoIniciarTurno()` nos efeitos ativos. `EfeitoDeDano` causa dano periódico; `EfeitoDeCura` recupera HP. O comportamento muda sem o processamento precisar identificar cada efeito pelo nome.

### O caminho de uma rodada

A função [criarBatalha()](../js/batalha/fabrica.js) monta as dependências e cria uma `Batalha` com o herói e o monstro. A interface chama `jogarTurno()` com a ação escolhida; no automático, passa `null`.

1. `Batalha.agir()` processa os efeitos do combatente antes da ação. Morte ou atordoamento podem impedir que ele aja.
2. A ação é consultada no registro `acoes`. `Atacar`, `UsarHabilidade`, `Defender` e `UsarPocao` implementam `executar()` de maneiras diferentes.
3. Em um golpe, `Batalha.golpear()` sorteia esquiva e crítico. A [CalculadoraDeDano](../js/batalha/dano.js) aplica os multiplicadores, defesa ou resistência e variação do dano. O alvo recebe o resultado por `receberDano()`.
4. Ao encerrar a ação de um combatente vivo, avançam recarga, recuperação de MP e passivas. O Ogro, por exemplo, sobrescreve `aoFimDoTurno()` para regenerar HP.
5. `verificarFim()` confere se a batalha acabou. Caso continue, o monstro responde; ao encerrar a rodada completa, avançam os efeitos controlados por rodada, como `Petrificado`.

Na vitória, [Recompensas.entregar()](../js/batalha/recompensas.js) consulta o XP do monstro e chama `Heroi.ganharXp()`. As poções são controladas por [Inventario](../js/modelo/inventario.js): `UsarPocao` consome um item antes de curar.

As mensagens passam por [Narrador](../js/batalha/narrador.js). Ele pede o texto a `MensagensPtBr` e o encaminha para `SaidaNaTela` ou `SaidaNoConsole`. Assim, a regra de combate é compartilhada pelas duas interfaces. Para salvar, `paraSalvar()` fornece os dados; `Heroi.carregar()` e `Monstro.carregar()` validam esses dados e reconstroem os objetos.

## 6. Onde os princípios SOLID aparecem

### S — Responsabilidade única

O cálculo de dano fica em `CalculadoraDeDano`; as quantidades de itens, em `Inventario`; a entrega de XP, em `Recompensas`; e os textos, em `MensagensPtBr`, usados pelo `Narrador`. Por exemplo, mudar uma frase não exige alterar a fórmula do ataque.

A separação tem limites: `Batalha` coordena os turnos e mantém o placar, enquanto `Heroi` ainda reúne atributos, progressão, carregamento e escolha automática. Portanto, a aplicação de responsabilidade única aparece nessa divisão concreta, sem afirmar que cada classe tenha uma única tarefa pequena.

### O — Aberto/fechado

O motor permite acrescentar comportamentos sem editar sua lógica central. Uma nova ação pode herdar de `Acao`, implementar `executar()` e entrar no registro passado por `criarBatalha()`. `Batalha.agir()` continuará chamando o mesmo método.

Isso não significa adicionar uma classe sem mexer em nenhum outro arquivo: um herói novo também precisa das fórmulas em `DADOS_HEROIS` e do registro em `CLASSES_HEROIS`. A extensão preserva o motor, mas exige configurar o novo conteúdo.

### L — Substituição de Liskov

As subclasses devem manter o comportamento esperado de sua base. Na batalha, `Guerreiro` e `Paladino` podem ocupar o papel de herói, respondendo a métodos como `estaVivo()`, `receberDano()` e `ganharXp()`. `Goblin` e `Ogro` podem ocupar o papel de monstro e fornecer `calcularXp()`.

Esses papéis são diferentes: não seria correto trocar um herói por um monstro em qualquer posição. Os testes percorrem todas as combinações de herói e monstro, o que verifica o uso atual desses contratos, sem ser uma prova de todas as possíveis extensões.

### I — Segregação de interfaces

O exemplo está na habilidade especial opcional. `Goblin` não implementa `usarHabilidade()`. A função `temHabilidadeEspecial()`, em `combatente.js`, verifica o método e os dados necessários, e `podeUsarHabilidade()` retorna falso quando essa capacidade não existe.

Assim, o Goblin não precisa de uma habilidade vazia apenas para participar da batalha. JavaScript não usa uma declaração formal de `interface` neste projeto; a capacidade é reconhecida pelos métodos e dados disponíveis no objeto.

### D — Inversão de dependência

`Batalha` recebe narrador, sorteio, calculadora, ações, inventário e recompensas pelo construtor. A escolha das implementações concretas acontece em `fabrica.js`, fora do controle dos turnos.

Por exemplo, nos testes, `SorteioFixo` substitui o sorteio normal e permite conferir um dano previsível. Outro teste injeta uma calculadora que devolve 7 e uma ação `Esperar`, verificando que o motor usa os objetos recebidos. O contrato é o método esperado, como `calcular()` ou `executar()`, e não uma implementação específica.

## 7. Regras, balanceamento e testes

O jogador distribui 30 pontos, com até 10 por atributo. Cada batalha começa com HP/MP cheios e três poções, que curam 35% do HP. A vantagem de classe acrescenta 25% aos golpes diretos. O herói age primeiro, e o limite é de 50 rodadas.

HP, dano e armaduras crescem 10% por nível. MP e resistências mantêm seus valores; crítico e esquiva ganham 0,25 ponto percentual por nível adicional, respeitando os limites. Defender reduz todos os golpes diretos até a próxima ação, mas não os danos periódicos de veneno e queimadura.

Na revisão, foram executadas **1.776.000 batalhas de validação**, incluindo todos os níveis de 1 a 20, diferenças de nível, distribuições alternativas e estratégias diferentes. Isso ajuda a encontrar desequilíbrios, mas não cobre toda distribuição de atributos ou decisão possível do jogador. Os relatórios dessa rodada não fazem parte desta entrega; o simulador permite gerar novas amostras. Os detalhes de duração, dano e progressão estão nas [regras completas](regras.md).

Para executar os testes e uma nova amostra de simulação:

```sh
npm test
node scripts/testar-console.cjs
node scripts/simular.cjs --amostras 300 --saida tmp/simulacoes/nova-simulacao.json
```

`npm test` executa a suíte de `js/testes.js`, também disponível em `testes.html`. Ela verifica dano, efeitos, recarga, HP/MP, salvamento, vantagens e substituição das dependências. A simulação padrão usa níveis 1, 5, 10 e 20, todas as 80 combinações e monstros do mesmo nível, +1 e +2. É possível mudar `--niveis`, `--deltas`, `--semente`, `--atributos aleatorios` e `--politica cautelosa`. `npm run balancear` grava a amostra em `tmp/simulacoes/nova-simulacao.json`, substituindo a saída anterior desse comando.

O teste opcional da interface web precisa do Chrome e do Playwright:

```sh
npm install --prefix tmp/browser-check playwright
node scripts/testar-navegador.cjs
```

Essa dependência é somente para testar a interface. O jogo e os testes de regras não precisam dela.
