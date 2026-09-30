# Operating model

Este é o adaptador técnico de `roadmap-orchestration`. Coordenação, autorização,
retomada, chats persistentes e trabalho humano pertencem ao
[núcleo compartilhado](execution-core.md), com dados no
[registro de execução](execution-record.md). Não duplique essa máquina de estados.
Os planos de `change-plan`, `nestjs-plan`, `laravel-plan`, `nuxt-plan` e
`fullstack-plan` continuam donos dos contratos e ondas de implementação.

## Entradas e saída

Aceite ideia, especificação, plano de ação ou inventário de features. Registre
fatos, fonte, hipóteses, objetivo, exclusões e evidências. A saída contém apenas
entregas necessárias, sem criar um épico duplicado para cada papel técnico.

Cada entrega corresponde a um `milestone.id` do registro compartilhado. Campos
`planning.model/effort` e `execution.model/effort` podem preservar a preferência
do usuário. Use `gpt-6-sol`/`medium` para decisões abertas e revisão substantiva,
`gpt-6-luna`/`high` para inventário/reconciliação mecânicos com contrato fechado.
Não recomende `gpt-6-astra` nem Sol acima de medium. O handoff técnico existente
define a exceção Luna/max somente para seu controller de execução.

## Atividade e estado técnico

`activity`: `planning`, `implementation`, `review`, `smoke`, `PR` ou `merge`.
Para um marco de software, `technical_state` pode registrar os estados abaixo;
o estado canônico do marco segue o núcleo comum, inclusive `completed` verificado.

| Estado técnico | Evidência/transição |
| --- | --- |
| `proposed` | Entrega candidata, escopo ainda não fechado. |
| `ready` | Contratos, dependências e autorização da atividade fechados. |
| `blocked` | Causa registrada e evidência/decisão que a remove. |
| `running` | Implementação autorizada em curso. |
| `review` | Implementação entregue para revisão delimitada. |
| `smoke` | Fluxo de tela/integração em verificação. |
| `pr-open` | PR remoto aberto; integração ainda pendente. |
| `integrated` | PR efetivamente integrado na base observada. |
| `deferred` | Adiamento explícito; não satisfaz dependências. |

Um PR `integrated` comprova integração, não garante todo critério de negócio.
Um marco administrativo não precisa de PR para estar `completed`.

## Dependências e ondas

Declare `A -> B` somente se B não pode produzir sua evidência sem A; registre a
razão (contrato, esquema/dados, autorização, write set, ambiente ou decisão).
Uma onda contém unidades sem dependência pendente entre si. Confira contratos,
propriedade dos arquivos, ambiente exclusivo e capacidade. Preserve as ondas
de planos existentes e delegue implementação a `nimbou-skills:executing-plans`;
seu `prose-execution.md` continua normativo. Não reescreva tarefas para coordená-las.

## Registro de tarefas e PRs

Antes de criar, reconcilie tarefas e PRs existentes por entrega, repositório,
branch, PR, estado e última evidência. Correspondência existente é canônica.
Nunca crie uma task sem autorização explícita que cubra criação e execução;
uma autorização vigente do plano pode cobrir seus chats e continuidade.

| Entrega | Atividade | Chat/PR existente | Estado efetivo | Evidência | Próxima ação | Autorizada? |
| --- | --- | --- | --- | --- | --- | --- |
| roles-api | implementation | Chat `abc` | running | commit `123` | aguardar conclusão | sim |
| admin-ui | implementation | — | blocked | depende de roles-api | nenhuma | não |

Para PRs, consulte o estado remoto atual: número/título, base/head, draft, checks,
conflitos, aprovações, mergeability e resumo do diff. **Never merge a PR without
explicit confirmation after showing that state.** Encaminhe a `nimbou-skills:merge-pr`.
A autorização de chats/monitoramento não habilita merge nem auto-merge.

## Retomada e encerramento

Releia a autorização vigente, reconcilie identidades e atualize estados com evidência.
Continue unidades cobertas pela autorização do plano; não exija nova permissão só
porque uma automação despertou ou uma filha terminou. Fora desse escopo, registre
a decisão pendente. Preserve pedidos de pausa/revogação.

Encerramento segue os critérios globais do núcleo comum; não use a simples soma
`integrated`/`deferred` como prova de sucesso. Ao terminar ou parar, pause a automação
(pause automation), ou delete it somente se autorizado, e confira o estado efetivo.
