# PROMPT — APP DE TARÔ ESTILO CYBERDECK (TUI Retrô-Futurista)

## CONTEXTO E OBJETIVO
Crie uma aplicação de Tarô em estilo **terminal/TUI retrô-futurista**, pensada para rodar em tela pequena de cyberdeck (resolução baixa, ~320x480 a 800x600). A estética é de um sistema operacional fictício hacker/cyberpunk, com bordas ASCII, fontes monoespaçadas, scanlines e glow neon. Use HTML/CSS/JS puro (sem frameworks pesados) para máxima compatibilidade com hardware limitado, ou React caso seja mais conveniente no Antigravity — manter tudo em single-file.

## ESTÉTICA GERAL / PALETA DE CORES
- Fundo: preto absoluto (#000000) ou roxo muito escuro (#1a0a2e / #120618).
- Duas paletas alternam conforme a tela:
  - **Paleta "Sistema" (menu raiz):** verde fosforescente neon (#39FF14 / #00FF66) sobre preto, com bordas em verde-ciano (#00FFAA). Lembra terminal Linux antigo (estilo `htop`/`neofetch`).
  - **Paleta "Tarot" (módulo de tarô):** magenta/rosa neon (#FF00AA / #FF2DAF) e roxo (#9D00FF) sobre fundo roxo-escuro translúcido, com detalhes em ciano (#00F0FF) e texto secundário em verde neon (#39FF14) para contraste.
- Todas as bordas são desenhadas em **caracteres ASCII/box-drawing** (┌─┐│└┘ ou estilo simplificado com `+`, `-`, `|`, `•`, `·`), nunca `border-radius` — cantos sempre retos.
- Efeito de **CRT scanlines** sutil sobre toda a tela (linhas horizontais translúcidas repetidas via `repeating-linear-gradient`) e leve **vinheta** nas bordas da tela.
- Leve **glow/text-shadow neon** em todos os textos e bordas (ex: `text-shadow: 0 0 4px currentColor, 0 0 8px currentColor`).
- Fonte: monoespaçada estilo terminal — `"Px437 IBM VGA8"`, `"VT323"`, `"Share Tech Mono"` ou fallback `monospace`. Tamanho pequeno (10-14px) para simular tela de baixa resolução.
- Cursor de texto piscante (▮ ou _) em alguns elementos, reforçando o look de terminal.
- Pontilhado decorativo (`· · · · ·`) usado como separador de seções e como "preenchimento vazio" em listas de menu.

## ESTRUTURA GERAL DA APLICAÇÃO (FLUXO DE TELAS)

### TELA 0 — MENU RAIZ DO SISTEMA (estilo OS, paleta verde)
Topo: caixa com título `[ COLMEIA ]` ou nome do sistema escolhido, em destaque.
Abaixo, uma barra de status com infos do sistema, formato:
WIFI: <nome_rede> | IP: 192.168.xx.xxx | TEMP: 39.0C | UPTIME: 4 minutos | TECLADO: A | <status_conexão>
(Esses dados podem ser mockados ou, se o ambiente permitir, lidos via JS/Node de fato — mas priorizar mock estático/simulado.)

Lista de menu vertical, cada item com marcador `•` à esquerda e preenchido com pontilhado até a borda direita:

TERMINAL ..........................
ENTIDADE ...........................
CONEXOES ...........................
MONITOR DO SISTEMA .................
NAVEGADOR ...........................
GAMES ...............................
APPS ................................   <-- TARÔ fica aqui dentro
CONFIGS .............................
REINICIAR ...........................
DESLIGAR ............................

Item selecionado fica destacado (fundo verde sólido + texto preto, ou inversão de cores).
Rodapé fixo com legenda de comandos:
[↕] NAVEGAR   [ENTER/CLICK] SELECIONAR   [Q] SAIR
Navegação: teclas de seta/↕ movem seleção, ENTER ou clique confirma, Q sai/volta.

Ao selecionar "APPS" → abre submenu (mesmo estilo) listando apps disponíveis, incluindo **TAROT**. Selecionar TAROT troca para a paleta magenta/roxo e entra na Tela 1.

### TELA 1 — SPLASH/ABERTURA DO APP TARÔ (paleta magenta)
Tela de boas-vindas minimalista, centralizada:
- Título grande em ASCII-art ou fonte estilizada: `TAROT` (rosa neon, com glow forte, leve glitch/flicker na entrada).
- Subtítulo pequeno abaixo, em texto menor (ex.: frase mística do tipo "as cartas refletem o caminho oculto" — gerar texto curto e atmosférico, evitando citações reais).
- Indicador de carregamento: pontos animados `● ● ● ● ● ●` que se preenchem sequencialmente da esquerda para a direita (efeito de loading), em loop ou até atingir 100% e avançar automaticamente / aguardando tecla.
- Após ~2-3s ou ao pressionar qualquer tecla, transiciona (fade ou corte seco) para a Tela 2.

### TELA 2 — MENU DO MÓDULO TARÔ (cabeçalho persistente)
Cabeçalho fixo no topo, presente em todas as telas internas do app, formato breadcrumb:

TAROT • <NOME_DA_SEÇÃO_ATUAL>

(ex.: `• TAROT • TIRAGEM DIÁRIA`, `• TAROT • HISTÓRICO`)

Menu principal do app com opções (lista similar ao menu raiz, mesma lógica de seleção):

TIRAGEM DIÁRIA .....................
TIRAGEM DE 3 CARTAS ................
TIRAGEM CELTA (10 CARTAS) ..........
HISTÓRICO ...........................
SOBRE O BARALHO .....................
VOLTAR ...............................

Rodapé com legenda de comandos contextual (ver seção "Rodapés" abaixo).

### TELA 3 — EMBARALHAMENTO / ANIMAÇÃO DE SHUFFLE
Ao escolher um tipo de tiragem, mostrar:
- Cabeçalho: `• ABRINDO O BARALHO` ou `• EMBARALHANDO`.
- Animação central: múltiplas cartas (representadas como retângulos com borda neon e padrão de "costas de carta" — linhas horizontais pontilhadas/hachuras em magenta, como nas imagens de referência) sobrepostas em leque, rotacionando e se reorganizando em sequência (efeito de embaralhar). Implementar via CSS transform (rotate + translate) com transição suave, ciclando posições por ~1.5-2.5s.
- Cada "verso de carta" é um retângulo (proporção ~2:3, tipo 70x110px) com borda verde-ciano fina e padrão de linhas horizontais tracejadas em magenta/rosa preenchendo o interior (textura têxtil/circuito).
- Ao final da animação, as cartas se alinham verticalmente centralizadas (uma única pilha de verso visível), indicando baralho "pronto", como mostrado na referência (carta única centralizada com borda ciano).
- Transição automática para a Tela 4 após a animação completar.

### TELA 4 — REVELAÇÃO DA CARTA (estilo "draw")
- Cabeçalho: `• TAROT • TIRAGEM DIÁRIA`.
- Caixa central pequena, estilo "ficha" com 3 blocos verticais separados por linha:
  1. Topo: número da carta em algarismos romanos (ex.: `XXI`).
  2. Meio: indicador de orientação — `(em pé)` ou `(invertida)`.
  3. Base: nome da carta em destaque (ex.: `O MUNDO`) e abaixo, entre aspas/tag, a palavra-chave central da carta (ex.: `"CONCLUSÃO"`).
- Animação de revelação: a carta de costas (mesmo visual do shuffle) faz um "flip" (rotação no eixo Y simulada via scaleX + troca de conteúdo, já que é 2D) revelando o conteúdo acima. Pode incluir um pequeno efeito de "glitch" (deslocamento RGB rápido) no momento do flip para reforçar a estética cyberpunk.
- Abaixo da carta, uma linha divisória horizontal neon, seguida de um parágrafo curto com a leitura resumida da carta (2-3 linhas), ex.: *"Conclusão, integração e realização plena. Ciclo completo. Totalidade que não precisa de mais nada — a saída é a chegada."*
- Um banner inferior fixo (estilo "toast/legenda"), com fundo sólido verde neon e texto preto, exibindo apenas o **nome da carta em maiúsculas** centralizado — destaque visual forte tipo "placa" (ver imagem 6 de referência: `O MUNDO`).
- Rodapé de comandos:
[←→] NAVEGAR   [D] DETALHE   [I] IA   [L] HISTÓRICO   [N] NOVA   [Q] SAIR

### TELA 5 — INTERPRETAÇÃO NEURAL (detalhe expandido / leitura via "IA")
Acionada pela tecla `[I]` (IA) ou `[D]` (Detalhe) na tela anterior.
- Cabeçalho: `• TAROT • TIRAGEM DIÁRIA`.
- Caixa pequena no topo central repetindo o número da carta (ex.: `XXI`).
- Abaixo, uma caixa com borda dupla/ASCII contendo o título `◄ INTERPRETAÇÃO NEURAL ►` e subtítulo `TIRAGEM DIÁRIA`.
- Dentro da caixa, texto interpretativo gerado, organizado em **linhas curtas e diretas** (estilo "saída de IA processando", uma frase por linha, sem bullets visuais — apenas quebras de linha), por exemplo:
A mensagem é de conclusão e integração.
O ciclo está completo, a totalidade é alcançada.
A jornada chegou ao fim, o objetivo foi alcançado.
Agora é o momento de celebrar e refletir.
A totalidade se manifesta, a unidade é restaurada.
A conclusão é clara, o fim é o novo começo.
- Linha de fechamento centralizada: `[ QUALQUER TECLA PARA FECHAR ]`.
- À esquerda da tela (fora da caixa principal), texto institucional/decorativo fixo verticalizado, tipo legenda lateral: nome da carta + frase-chave (ex.: `O MUNDO É HOMA... Conclusão. Ciclo, totalidade e realização plena. Tudo se conclui — o caminho...` — texto truncado/cortado pela borda da tela, reforçando estética de terminal pequeno).
- Rodapé:
[←→] NAVEGAR   [D] DETALHE   [I] IA   [L] HISTÓRICO   [N] NOVA   [Q] SAIR
- Fechar com qualquer tecla retorna à Tela 4.

### TELA 6 — HISTÓRICO DE TIRAGENS
Lista cronológica das últimas tiragens salvas (localStorage), cada linha com: data/hora, tipo de tiragem, carta(s) sorteada(s) e orientação. Mesmo estilo de lista com pontilhado. Selecionar uma entrada reabre a Tela 4 com os dados daquela tiragem.

### TELA 7 — SOBRE O BARALHO
Texto estático curto explicando o conceito do app (não o tarô real histórico, apenas flavor text do "sistema"), em poucas linhas, paleta magenta.

## LÓGICA FUNCIONAL DO TARÔ (REGRAS DE NEGÓCIO)

1. **Baralho:** implementar os 22 Arcanos Maiores (0–21) como mínimo viável; opcionalmente os 56 Arcanos Menores (4 naipes: Paus, Copas, Espadas, Ouros, cada um Ás–10 + 4 cortes) para o baralho completo de 78 cartas.
2. **Estrutura de dados por carta** (array/JSON):
   - `numero` (string em romano para exibição, ex.: "XXI"; inteiro para lógica),
   - `nome` (ex.: "O Mundo"),
   - `palavraChave` (ex.: "Conclusão"),
   - `significadoEmPe` (texto curto, 1-2 frases),
   - `significadoInvertida` (texto curto, 1-2 frases),
   - `interpretacaoNeural` (array de 5-6 frases curtas para a tela de interpretação expandida, geradas a partir do significado).
3. **Sorteio:** ao confirmar uma tiragem, randomizar (a) qual carta sai e (b) sua orientação (50% em pé / 50% invertida, sem repetição dentro da mesma tiragem multi-carta).
4. **Tipos de tiragem:**
   - Tiragem Diária: 1 carta.
   - Tiragem de 3 Cartas: passado/presente/futuro, 3 cartas em posições nomeadas.
   - Tiragem Celta (opcional/avançada): 10 cartas em cruz, layout adaptado ao espaço reduzido (pode ser navegação sequencial entre cartas em vez de grade, dado o tamanho da tela).
5. **Persistência:** salvar histórico de tiragens em `localStorage` (data, tipo, cartas, orientações). Não usar localStorage se o destino final for um Artifact do Claude — nesse caso usar apenas estado em memória (variável JS), mas como o projeto é para o Antigravity/ambiente próprio, localStorage é permitido normalmente.
6. **Geração de texto "neural":** a interpretação expandida não precisa de IA real — é texto pré-escrito por carta, mas apresentado com efeito visual de "saída processada" (delay incremental de linha por linha, tipo `typewriter`, para simular processamento).

## ANIMAÇÕES (RESUMO TÉCNICO)
- **Flicker de entrada** no logo TAROT (opacidade oscilando rapidamente 2-3x ao montar a tela).
- **Loading dots** sequenciais (preenchimento de ● um a um, CSS `animation-delay` escalonado).
- **Shuffle**: cartas com `transform: rotate() translate()` aleatorizado em loop curto, convergindo para pilha alinhada central.
- **Flip de revelação**: `transform: scaleX(0)` → conteúdo troca → `scaleX(1)` (simula virar a carta), opcionalmente com leve glitch RGB (`filter: drop-shadow` duplicado em ciano/magenta deslocado 1-2px, por 100-150ms).
- **Typewriter** na interpretação neural: cada linha aparece com pequeno delay sequencial (100-200ms entre linhas) ou efeito de digitação caractere a caractere.
- **Scanlines/CRT**: estático, sempre presente, `repeating-linear-gradient` translúcido sobreposto a toda a tela (`pointer-events: none`).
- Transições entre telas: corte seco (estilo terminal) ou fade rápido (150-250ms), nunca slide suave — manter a aspereza retrô.

## CONTROLES / INTERAÇÃO
- Suporte total a teclado: setas para navegar, Enter/Espaço para confirmar, Q/Esc para voltar/sair, teclas de letra (D, I, L, N) como atalhos contextuais mostrados no rodapé.
- Suporte a clique do mouse como alternativa (já que cyberdeck pode ter touchpad), conforme indicado em "ENTER/CLICK SELECIONAR" do rodapé original.
- Rodapé de comandos sempre visível e atualizado conforme o contexto da tela atual.

## REQUISITOS TÉCNICOS
- Single-file HTML/CSS/JS (sem build step), responsivo para telas pequenas (320–800px largura), sem dependência de internet (fontes via `@font-face` local ou fallback `monospace`/`VT323` do Google Fonts com fallback offline).
- Performance leve (hardware de cyberdeck é limitado — evitar animações pesadas, blur excessivo ou bibliotecas grandes).
- Código organizado em seções claras: dados das cartas, máquina de estados de telas, renderização, input handler, animações.