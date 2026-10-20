---
name: action-plan
description: Use quando precisar criar, revisar ou executar um plano de ação com marcos administrativos, técnicos ou humanos.
---

# Plano de Ação

## Formato de tarefas para uso entre setores

Quando o usuário pretende criar tarefas posteriormente em um sistema, distribuir
trabalho entre setores ou pede um PDF simples para público não técnico, use o
**formato de tarefas**. Esta seção prevalece sobre as instruções de 5W2H,
ação de 48h e apresentação PDCA abaixo; estas continuam válidas apenas para
o formato legado de ações. Não tente disfarçar uma tabela 5W2H trocando seu título.

- Objetivo: uma frase de resultado e prazo. Porte, escopo, método e justificativas
  extensas podem ficar no JSON ou na análise, mas não entram no PDF desse formato.
- Marco: resultado intermediário verificável. Sob cada marco, inclua **tarefas**
  criáveis separadamente no sistema; acrescente **subtarefas** somente quando
  ajudarem a executar uma tarefa sem abrir outra responsabilidade independente.
- Cada tarefa tem ID estável, título com verbo, responsável nominal ou
  `DONO A DEFINIR (setor)`, previsão e critério de conclusão. Use `depende_de`
  com IDs de tarefas anteriores; não invente uma dependência só porque tarefas
  aparecem em sequência. Dependências entre setores ficam explícitas.
- No PDF, redija o título como **uma instrução curta no imperativo**
  ("Verifique o ambiente de teste."). Mostre cada tarefa em um cartão compacto:
  título; responsável, previsão e dependência na mesma linha; critério de
  conclusão curto; subtarefas apenas para detalhes indispensáveis. Não repita
  no critério aquilo que o título já diz nem abra uma legenda genérica antes
  dos marcos. Evite tabela de várias colunas para tarefas com texto longo.
- A versão para gestores usa palavras que qualquer setor entende. Siglas,
  códigos de aprovação, nomes de permissões e detalhes de banco ficam em
  documentação técnica, não nos títulos ou critérios do PDF.
- Mostre as próximas fases como sequência visual simples. Limites do piloto ou
  condições importantes podem aparecer em pequenos cartões/diagrama, sem
  esconder o que continua oficial. Mostre gatilhos de ajuste quando úteis.
- Não exiba seções de primeira ação, 5W2H, PDCA, riscos ou backlog só porque
  existem no template. Campos internos podem permanecer no JSON sem ir ao PDF.
  Datas intermediárias são previsões ajustáveis; destaque o prazo final quando
  este for o compromisso principal.
- Para esse formato, grave `marcos[].tarefas[]` conforme
  [schema](references/schema.md). O mesmo `build_plan_pdf.py` detecta tarefas
  e gera o PDF adequado; planos antigos com `acoes[]` preservam o layout anterior.
  Não publique tarefas externas nem contate setores só por constarem no plano.

## O que esta skill faz

Conduz uma entrevista curta e produz um **plano de ação em PDF**, versionado por ciclo (v1, v2, v3…). Escala do plano pequeno de uma frente ao **programa multi-fase** de meses. Também executa um plano aprovado, com chats persistentes por marco, acompanhamento a cada 30 minutos e tarefas humanas pelo MCP FAEPEN.

O planejamento define o conteúdo de gestão. A execução usa o mesmo contrato de
coordenação de `nimbou-skills:roadmap-orchestration`, sem exigir que o usuário
transforme o plano administrativo em um roadmap técnico.

O ponto não é "gerar um plano" — qualquer modelo faz isso. É gerar um plano que **sobrevive ao contato com a realidade**. Planos de trabalho quase sempre morrem das mesmas quatro formas, e o método existe inteiro para bloquear cada uma:

| Modo de falha | Como se manifesta | Guardrail |
|---|---|---|
| Ação vaga | "Melhorar o processo de onboarding" | Verbo físico observável + critério de conclusão |
| Sem dono / sem data | Responsável = "a equipe"; prazo = "Q3" | Um nome próprio, uma data exata |
| Plano inflado | 40 ações detalhadas de uma vez, zero execução | Só a **fase ativa** é detalhada; o resto vira roadmap/backlog |
| Ninguém revisa | Vira PDF morto na primeira semana | Cadência, indicadores e gatilhos de ajuste dentro do doc |

Um plano bonito que viole qualquer um desses é uma falha da skill — mesmo que o usuário goste na hora. No formato de tarefas, use previsão honesta em vez de impor uma data exata fictícia a cada ação.

## Modos

**Modo NOVO PLANO** (padrão): o usuário traz um objetivo, cru ou detalhado. Rode as fases, confirme os marcos, gere o PDF v1.

**Modo REVISÃO**: o usuário traz um plano existente (PDF de um ciclo anterior) e quer fechar/atualizar o ciclo. Extraia o conteúdo do PDF (`pdftotext -layout arquivo.pdf -`, ou pypdf), rode as fases 5 → 3 → 4 (Ciclar → re-Estruturar → Destravar) e gere a versão seguinte com a seção **Check / Act** preenchida. Não recomece do zero: o valor da revisão está em comparar planejado com realizado. Em programa multi-fase, a revisão fecha a **fase ativa** e promove a próxima fase do roadmap a ativa — detalhando-a agora até a ação.

**Modo EXECUÇÃO / ACOMPANHAMENTO**: o usuário pede para executar ou retomar um
plano aprovado. Leia obrigatoriamente o
[núcleo compartilhado de execução](../roadmap-orchestration/references/execution-core.md)
e seu registro de dados; siga esse caminho em vez de refazer a entrevista ou gerar
outro PDF antes de agir. Anuncie: “Estou usando `action-plan` para executar este plano.”

Carregue `plano.json` e o `execucao.json` existente. Se houver apenas PDF, extraia
e reconcilie objetivo, marcos e critérios antes do despacho; não invente lacunas.
O pedido de execução com chats persistentes, heartbeat e tarefas humanas autoriza
a continuidade dessas ações no escopo registrado. Gerar/aprovar o PDF por si só
não inicia chats, acompanhamento nem tarefas externas.

O pai cria chats para os marcos automáticos, confere resultados, encaminha ações
humanas ao setor definido e continua as frentes liberadas. A automação de 30 minutos
retoma essa coordenação. Conclusão exige evidência por marco e pelo objetivo; status
de sessão/tarefa isolado não basta. Marcos técnicos usam as skills da stack e
`nimbou-skills:executing-plans` quando houver plano por ondas aprovado.

Ao encerrar o ciclo, incorpore resultados em Check/Act e gere a versão de gestão
seguinte quando solicitada; preserve IDs/mapeamentos. Não promova fases futuras
fora do escopo autorizado. Reporte marcos comprovados, pendências, tarefas humanas
e o estado efetivo do acompanhamento.

Infira o modo do pedido e do contexto. Pergunte somente se a distinção entre
planejar e iniciar execução estiver ambígua.

## Porte do plano — dimensione antes de estruturar

Nem todo objetivo cabe em um ciclo. O porte define quantas fases e quantas perguntas:

| Porte | Sinais | Estrutura | Horizonte |
|---|---|---|---|
| Pequeno | 1 resultado, 1 dono, poucas frentes | 2-3 marcos, ciclo único | 2-4 semanas |
| Médio | várias frentes, uma equipe | 3-5 marcos, ciclo único | 30-90 dias |
| Grande | múltiplas frentes/dependências | 5-8 marcos, uma ou duas fases | 3-6 meses |
| Programa | iniciativa que não termina em um ciclo | várias **fases**, cada uma um ciclo executável | 6-18 meses |

**Regra que não muda com o porte: só a fase ativa é detalhada.** No formato legado, você preenche 5W2H + ação de 48h; no formato de tarefas, detalha tarefas, subtarefas necessárias e dependências apenas nos marcos da **fase ativa** (a que começa agora). As fases seguintes entram como esboço. Detalhar seis meses à frente envelhece em duas semanas.

Não pergunte "seu plano é grande?". Infira o porte de quantas frentes e quantos donos apareceram na captura. No formato legado, confirme o porte junto com os marcos; no formato de tarefas, confirme apenas a sequência e o corte entre fase atual e próximas fases.

## As 5 fases + o portão

Detalhes, banco de perguntas e exemplos de reescrita estão em `references/method.md`. Leia esse arquivo antes da fase 1 — é curto e é onde mora a substância do método.

### Fase 1 — Confrontar
Antes de planejar, ataque o objetivo. A maioria dos planos ruins é um plano bem-feito para o objetivo errado.

Use **Perguntas Poderosas**: qual é o resultado real (não a atividade)? Por que agora? Qual o custo de não fazer nada? O que já foi tentado e falhou, e por quê?

Saída da fase: **objetivo em uma frase, com indicador e prazo**. Se não dá para medir se foi atingido, ainda não é objetivo — é desejo.

**Confirme o objetivo campo a campo, com opções, antes de seguir.** O objetivo é a raiz do plano — se ele estiver torto, todo o resto herda o erro, e aqui é onde consertar é mais barato. Ofereça, numa rodada concisa, **opções concretas** para cada campo que você **inferiu ou reformulou** — nunca para o que o usuário já ditou literal:

- **Resultado (frase)**: ofereça 2-3 reformulações — a sua proposta + variações de escopo (mais estreita / mais ampla).
- **Indicador**: ofereça os candidatos de métrica ("churn mensal %" vs "nº de cancelamentos" vs "NRR").
- **Meta**: ofereça faixas — conservadora / alvo / agressiva (ex.: "6,2%→5%", "6,2%→4%", "6,2%→3%").
- **Prazo**: ofereça datas candidatas ancoradas em algo real (fim do trimestre, data da diretoria).

Campo que o usuário já deu exato, não pergunte — confirme no resumo. Como são opções para clicar, não perguntas abertas, isso custa pouca fricção mesmo cobrindo vários campos.

### Fase 2 — Capturar
Antes de organizar, despeje. Peça tudo o que já existe na cabeça do usuário sobre o tema — pendências, ideias, obstáculos, gente envolvida, coisas que já começaram — sem julgar, sem ordenar, sem filtrar.

Isso existe porque planejar direto a partir da memória seletiva produz planos que esquecem justamente o que já estava travando. A captura bruta é o antídoto. Se o usuário travar, pergunte: "o que mais está pendurado nisso que ainda não falamos?"

### Fase 3 — Clarificar e Estruturar
Cada item capturado vira uma de quatro coisas: **lixo** (descarte), **referência** (informação, vai para nota), **ação** (alguém faz) ou **marco** (resultado intermediário verificável).

Estruture em três (ou quatro) níveis:

```
Objetivo (1 frase + indicador + prazo)
└── Fase ativa (só em plano grande/programa)
    └── Marco 1 (resultado verificável, não tarefa)
        ├── Tarefa 1.1 (ou ação 5W2H no formato legado)
        └── Tarefa 1.2, com subtarefas e dependências quando necessário
└── Fases futuras → roadmap (nome, resultado, período, marcos previstos — sem 5W2H)
```

Um marco é um **estado do mundo**, não um esforço: "Fluxo de cobrança automatizado rodando em produção" é marco; "Trabalhar na automação" não é.

No formato legado, cada ação **da fase ativa** carrega o 5W2H completo — *o quê, por quê, quem, quando, onde, como, quanto* — mais um critério de conclusão. No formato de tarefas, use título, responsável, previsão, critério, subtarefas necessárias e dependências reais.

### Portão — Confirmar os marcos (obrigatório antes da fase 4)

Estruturar marcos é a decisão mais cara do plano: é onde o objetivo vira arquitetura. **Não detalhe ações (fase 4) sobre marcos que o usuário ainda não confirmou** — detalhar um marco errado é o retrabalho mais caro de desfazer.

Volte ao usuário com os marcos propostos e confirme com opções claras, usando a interface estruturada quando disponível. Duas camadas:

**Camada 1 — o conjunto (uma rodada):**

1. **O conjunto está certo?** Apresente os marcos como lista curta (estado do mundo, não tarefa). Falta algum? Sobra algum? Deixe o usuário adicionar/remover.
2. **A sequência e o corte de fase.** Qual marco vem primeiro? Onde termina a fase que começa agora e onde começa a próxima? (é o que separa **fase ativa** de **roadmap**). Confirme o porte inferido apenas no formato legado.

**Camada 2 — item a item de cada marco, com opções, só onde necessário.** Para cada marco confirmado, confirme os campos que você **inferiu** (não os que o usuário ditou), oferecendo opções — uma pergunta por marco quando necessário (agrupe os marcos leves):

- **Nome / resultado verificável**: ofereça a formulação como estado do mundo + variações ("Cobrança recorrente em produção" vs "Cobrança recorrente para clientes novos"). É aqui que "estudar concorrentes" é flagrado como não-marco antes de custar caro.
- **Prazo**: ofereça datas candidatas (não deixe o usuário digitar do zero se você já tem âncoras).
- **Indicador**: ofereça as métricas candidatas de progresso do marco.

"Se necessário" é a régua: campo que o usuário já fixou, você só confirma no resumo; campo que você preencheu por inferência, você **pergunta com opções**. O usuário responde clicando — por isso dá para descer ao nível de item sem cansá-lo, desde que você não pergunte o que já está decidido. Só avance para a fase 4 depois que os marcos (conjunto + itens inferidos) estiverem validados.

Quantas perguntas: uma por eixo acima, mais uma confirmação por marco de peso. Plano pequeno: 1-2 perguntas. Programa: 4-6 — e está certo gastar aqui. Só avance para a fase 4 quando o usuário validar a lista.

### Fase 4 — Destravar
No formato legado, para cada marco **da fase ativa**, defina a **ação de 48h**: a menor ação física que pode ser feita nas próximas 48 horas e que quebra a inércia. No formato de tarefas, não crie nem exiba esse campo; a primeira tarefa sem dependências já mostra por onde começar.

No formato legado, se a ação de 48h não couber em ~2 horas de trabalho de uma pessoa, ainda está grande demais. Marcos de fases futuras **não** recebem ação de 48h — só ganham detalhe quando viram fase ativa.

### Fase 5 — Ciclar (PDCA)
O plano precisa conter as condições da própria revisão:

- **Indicador por marco** (como medir progresso, não só conclusão)
- **Cadência de revisão** e a **data da próxima revisão** (data exata, dentro do documento)
- **Gatilhos de ajuste**: o que precisa acontecer para replanejar, cortar ou abortar um marco — ou para **promover a próxima fase** do roadmap
- **Premissas e riscos**: examine o que estamos assumindo sem prova e o que fazer se cair; no formato de tarefas, leve ao PDF apenas limites e gatilhos relevantes, sem seção obrigatória de riscos

Na v2+, esta fase produz a seção **Check / Act**: o que foi entregue, o que não foi e por quê, o que aprendemos, o que muda no próximo ciclo. Em programa, o Act fecha a fase ativa e promove a próxima.

## Guardrails — aplique antes de gerar o PDF

Rode esta checagem no plano montado. Os três primeiros você **corrige direto** (reescreva, não peça permissão para melhorar). O quarto você **sinaliza sem bloquear**.

**1. Ação vaga → reescreva.** Toda ação precisa de verbo físico e observável. Se um estranho não consegue dizer "isso foi feito" olhando para o resultado, não está pronta.

| Vago | Afiado |
|---|---|
| Melhorar o processo de onboarding | Reescrever o roteiro de onboarding em 1 doc de 2 páginas e validar com 2 clientes novos |
| Alinhar com o time comercial | Rodar reunião de 45min com Marina e Caio e sair com a lista de objeções priorizada |
| Acompanhar os indicadores | Montar planilha de churn semanal e enviar o número toda segunda 9h |

Verbos suspeitos: melhorar, otimizar, alinhar, acompanhar, revisar, estruturar, trabalhar em, dar atenção a. Não são proibidos — são sinal de que falta o objeto verificável.

**2. Dono e data → não invente.** No formato legado, um nome próprio por ação e uma data exata (DD/MM/AAAA). No formato de tarefas, use responsável nominal quando confirmado; senão `DONO A DEFINIR (setor)`. Datas intermediárias podem ser previsões, sem falsa precisão. Registre a indefinição na própria tarefa, não crie uma seção de riscos para isso.

**3. Cadência de revisão → obrigatória.** O plano só está pronto quando tem data da próxima revisão. Sem isso é um documento, não um ciclo.

**4. Inflação → contenha a fase ativa, não o plano inteiro.** A disciplina não é "poucos marcos", é "poucos marcos *detalhados de uma vez*". A **fase ativa** cabe em 3 a 5 marcos e tarefas executáveis. O que ainda depende dessa fase vira **fase futura**; itens apenas possíveis podem permanecer em notas internas. No formato legado, o backlog continua disponível. Avise o corte em uma frase e siga — o usuário pode puxar de volta se quiser.

## Como conduzir a entrevista

Ofereça opções concretas na interface estruturada quando ela estiver disponível; caso contrário, use texto conciso.

**Orçamento em duas naturezas diferentes — não as confunda:**

- **Descoberta (fases 1-2): 5 a 8 perguntas abertas**, em 2 ou 3 rodadas. É o orçamento caro: pergunta aberta cansa. Cubra, nesta ordem: resultado real e indicador → prazo/ciclo → quem está envolvido (nomes) → restrições (orçamento, time, sistemas, legal) → o que já foi tentado → o que já existe pendente (captura). Passar disso e o usuário abandona na fase mais valiosa.
- **Confirmação por opções (objetivo ao fim da fase 1; marcos no portão fase 3→4): barato, pode ser item a item.** Confirme só o que você inferiu; agrupe campos relacionados em uma rodada curta. Regra: campo que o usuário ditou exato → confirme no resumo, não pergunte; campo que você preencheu por inferência → ofereça opções e deixe ele escolher. Uma rodada de opções para o objetivo, mais uma por marco de peso (agrupando os leves).

Descubra e estruture primeiro; confirme (objetivo e marcos) depois, sempre por opções. Confirmar marcos antes de ter capturado é confirmar um palpite.

Se o usuário já trouxe contexto rico (briefing, ata, diagnóstico), **não pergunte o que já está escrito** — extraia, confirme num resumo curto e gaste as perguntas só nas lacunas e no portão de marcos.

O que não ficar claro vira **premissa explícita** no documento, não silêncio. Marque como `Premissa (não validada)` e siga: um plano com premissas declaradas é honesto; um plano com buracos escondidos é armadilha.

## Público e registro do documento

Separe as duas vozes: **a entrevista é com quem planeja; o PDF é para quem patrocina.** O documento gerado será lido por um **stakeholder ou pela gerência geral** — escreva-o nesse registro desde a v1. A conversa pode ser informal; o documento, não.

- **Português de negócio, claro e direto.** Frases curtas e afirmativas. Nada de gíria e, principalmente, **nada de linguagem de método vazando para o conteúdo**: "quebrar a inércia", "despejar na captura", "engenharia de arranque", "ação de 48h" são vocabulário interno da skill — não aparecem no PDF.
- **Resultado antes de esforço.** Cada seção abre pelo que muda para o negócio — indicador, receita, risco, prazo — não pela atividade. O gestor quer o *quê* e o *porquê* antes do *como*.
- **Rigor é linguagem de gestão, não o oposto dela.** Responsável, previsão honesta, dependência e critério de conclusão dão credibilidade ao formato de tarefas. No formato legado, mantenha também data exata e custo por ação. Muda o tom, não a exigência de verificabilidade:

| Voz interna (não vai ao PDF) | Registro do documento |
|---|---|
| "Ana abre a planilha e cruza os cancelamentos" | "Ana consolida a análise de cancelamentos por coorte (base de CS); entrega em 22/07" |
| "Ação de 48h: mandar mensagem pro Rafael" | "Primeira ação: alinhar com Rafael (Comercial) a lista de objeções — até 16/07" |

- **Detalhe operacional cru não vira narrativa.** No formato legado, fica no campo *Como*. No formato de tarefas, vira subtarefa apenas se ajudar quem vai executar.
- **Números e dinheiro sempre que existirem.** "R$ 90 mil de MRR em risco por mês" comunica a um diretor mais do que "muitos cancelamentos".
- **Honestidade preservada.** `DONO A DEFINIR` e limites importantes continuam visíveis. No formato legado, premissas e riscos também aparecem. Não esconda lacunas para "ficar bonito".

Vale para todo campo que o gestor lê: objetivo, marcos, tarefas, limites e próximas fases; no formato legado, também riscos, premissas, backlog e Check/Act. Antes de gerar o PDF, releia o `plano.json` com os olhos da gerência: se alguma frase soa como bilhete interno, reescreva.

## Gerando o PDF

Grave fontes e PDFs em `docs/plans/<slug>/`, salvo destino indicado pelo usuário.
Monte o plano num `plano.json` e rode o script. Ele escolhe o layout de
tarefas quando encontra `marcos[].tarefas[]` e preserva o layout 5W2H dos
planos legados. Antes de gerar, confira que cada dependência aponta para uma
tarefa anterior; o script também rejeita IDs ausentes, repetidos e dependências
desconhecidas ou circulares:

```bash
python3 "<skill-dir>/scripts/build_plan_pdf.py" plano.json plano_v1.pdf
```

O script fica no diretório da skill, não no diretório de trabalho — use o caminho absoluto da pasta da skill (use o caminho da pasta da skill no Codex). Ele depende de `reportlab`: se faltar, `pip install reportlab` (ou `pip install --break-system-packages reportlab`).

O schema completo dos dois formatos está em `references/schema.md`. Exemplo
do formato legado (os campos `escopo` e `fases_futuras` são opcionais):

```json
{
  "titulo": "Reduzir churn de clientes PME",
  "versao": 1,
  "escopo": {"porte": "grande", "fase_ativa": "Fase 1 — Diagnóstico e primeiros 45 dias"},
  "objetivo": {"frase": "...", "indicador": "...", "meta": "...", "prazo": "30/09/2026", "por_que_agora": "...", "custo_da_inacao": "..."},
  "ciclo": {"inicio": "14/07/2026", "fim": "30/09/2026", "cadencia_revisao": "Quinzenal, terças 10h", "proxima_revisao": "28/07/2026"},
  "marcos": [{"nome": "...", "resultado_verificavel": "...", "indicador": "...", "prazo": "...", "acao_48h": "...", "acoes": [{"o_que": "...", "por_que": "...", "quem": "...", "quando": "...", "onde": "...", "como": "...", "quanto": "...", "criterio_conclusao": "..."}]}],
  "fases_futuras": [{"nome": "Fase 2 — ...", "resultado": "...", "periodo": "out–nov/2026", "marcos_previstos": [{"nome": "...", "resultado_verificavel": "...", "prazo": "..."}]}],
  "riscos": [...], "premissas": [...], "gatilhos_ajuste": [...], "backlog": [...]
}
```

Nomeie o arquivo `plano_<slug-do-objetivo>_v<N>.pdf` — a versão no nome é o que torna o ciclo PDCA rastreável quando existirem v1, v2 e v3 na mesma pasta.

Entregue o PDF ao usuário e feche com **uma frase**: objetivo, número de marcos ativos e próxima revisão; mencione porte apenas no formato legado. Não narre o método de volta ao usuário — ele acabou de participar dele.

## Bundled

- `references/method.md` — banco de Perguntas Poderosas, campos 5W2H, portão de confirmação dos marcos, fases/roadmap, PDCA na prática. **Leia antes da fase 1.**
- `references/schema.md` — schema completo do `plano.json`, incluindo `escopo` e `fases_futuras`.
- `scripts/build_plan_pdf.py` — gera o PDF a partir do `plano.json`.
