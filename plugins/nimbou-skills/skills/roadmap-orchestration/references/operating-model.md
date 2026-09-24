# Operating model

Este é o contrato operacional de `roadmap-orchestration`. Ele complementa, mas não
substitui, os planos de `change-plan`, `nestjs-plan`, `laravel-plan`, `nuxt-plan` e
`fullstack-plan`. Quando um desses planos existe, preserve seus contratos e use este
modelo para coordenar autorização, estado e interfaces entre atividades.

## Entradas e saída

Aceite uma ideia, especificação aprovada, plano existente ou inventário de features.
Para cada fonte, registre o que é fato, a origem e o que ainda é hipótese. A saída é
um roadmap enxuto: entregas necessárias, não épicos duplicados ou tarefas de cada
papel.

```yaml
roadmap:
  objective: "resultado observável"
  exclusions: ["fora do escopo"]
  planning: { model: "opcional", effort: "opcional" }
  execution: { model: "opcional", effort: "opcional" }
  deliveries:
    - id: metrics-api
      outcome: "cards recebem métricas confiáveis"
      evidence: "contrato e teste/observação definidos"
      depends_on: []
      state: ready
      activity: implementation
  waves:
    - id: 1
      entries: [metrics-api]
      release_condition: "contratos e write sets independentes"
  pending_authorizations: ["criar as tarefas candidatas da onda 1"]
```

## Estados e atividades

Use somente o menor estado que explica a situação atual. `blocked` sempre exige uma
causa e uma evidência/decisão que o remove.

| Estado | Significado | Próxima transição permitida |
| --- | --- | --- |
| `proposed` | Entrega candidata ainda não autorizada | `ready`, `blocked`, `deferred` |
| `ready` | Tem escopo, dependências e autorização para a atividade seguinte | `running` |
| `blocked` | Falta decisão, contrato, acesso ou predecessor observável | `proposed`, `ready`, `deferred` |
| `running` | Atividade autorizada em curso | `review`, `blocked` |
| `review` | Implementação concluída; revisão delimitada em curso | `smoke`, `pr-open`, `blocked` |
| `smoke` | Fluxo de tela/integração aguardando ou passando smoke | `pr-open`, `blocked` |
| `pr-open` | PR aberto, ainda não integrado | `integrated`, `blocked` |
| `integrated` | PR efetivamente integrado na base | terminal |
| `deferred` | Usuário excluiu/adiou explicitamente | terminal |

`activity` é uma destas fases: `planning`, `implementation`, `review`, `smoke`, `PR`
ou `merge`. Elas não são sinônimos de estado. Por exemplo, uma entrega em `pr-open`
tem atividade `PR`; merge só começa após uma confirmação explícita separada.

## Dependências e ondas

Declare `A -> B` somente se B não pode produzir sua evidência sem A. Cada aresta
precisa de uma razão: contrato, esquema/dados, autorização, write set, ambiente ou
decisão de produto. “É mais confortável fazer antes” não é dependência.

Uma onda contém somente nós sem dependência pendente entre si. Também valide:

- write sets não se sobrepõem ou há um único dono deliberado;
- contratos compartilhados já estão fechados;
- agentes não exigem o mesmo ambiente/credencial exclusiva;
- a configuração de modelo e esforço cabe no risco da unidade;
- capacidade disponível deixa um slot para coordenação.

Se qualquer condição falhar, coloque a unidade em onda posterior ou torne-a
`blocked`. Nunca inicie uma frente por suposição.

## Registro de tarefas e PRs

Antes de qualquer criação, reconcilie por entrega, repositório, branch, PR, estado e
última evidência. Uma correspondência existente vira o registro canônico; não crie
outra tarefa para “garantir”.

| Entrega | Atividade | Task/PR existente | Estado efetivo | Evidência | Próxima ação | Autorizada? |
| --- | --- | --- | --- | --- | --- | --- |
| roles-api | implementation | Task `abc` | running | commit `123` | aguardar conclusão | sim |
| admin-ui | implementation | — | blocked | depende de roles-api | nenhuma | não |

Para PRs, estado efetivo significa dados remotos atuais: número/título, base/head,
draft, checks, conflitos, aprovações, mergeability e resumo do diff. “Passou CI” não
substitui esse snapshot. **Never merge a PR without explicit confirmation after
showing that state.** `nimbou-skills:merge-pr` é o único encaminhamento de merge.

## Autorizações, execução e retomada

Use verbos separados no registro: `recommend`, `create-task`, `start-task`,
`send-message`, `open-pr`, `monitor`, `enable-auto-merge`, `merge`, `pause-automation`.
Registre quem autorizou, em que escopo e a data/turno. Nunca crie uma task without
explicit authorization, mesmo quando o roadmap a marca `ready`.

Ao retomar:

1. leia o último roadmap e sua autorização ainda válida;
2. reconcilie tarefas/PRs existentes e automações pelo identificador, sem duplicá-los;
3. atualize estados com evidência observável;
4. publique apenas mudanças, bloqueios e ações que requerem decisão;
5. espere autorização antes de iniciar entregas, enviar mensagens, abrir PRs ou
   reativar automação.

Se a execução já tem plano por ondas aprovado, encaminhe a implementação para
`nimbou-skills:executing-plans`; esta skill mantém o registro e a fronteira de
autorização, não reescreve as tarefas desse plano.

## Modelos, esforço, monitoramento e encerramento

O usuário pode definir `planning.model/effort` e `execution.model/effort`
independentemente. O maior modelo permitido é `gpt-6-sol`, com esforço até
`medium`. Use
`gpt-6-sol`/`medium` para ambiguidade de domínio, contratos, segurança,
dependências, implementação comportamental e revisão substantiva. Use
`gpt-6-luna`/`high` para inventário, reconciliação e formatação
com fonte e critério de aceite fechados. Não recomende `gpt-6-astra` nem esforço
abaixo de `high` para Luna ou acima de `medium` para Sol. Preserve uma escolha
explícita que respeite esses limites;
se ela for insuficiente, reduza o escopo ou exponha a limitação, sem elevar o
modelo silenciosamente. Ao criar tarefas, registre o modelo e o esforço efetivos
e confira que ambos respeitam o teto.

Crie monitoramento recorrente somente com autorização explícita. Uma automação já
ativa pode continuar somente durante o escopo e a duração registrados; nunca a reative
por inferência. Sua política é silenciosa enquanto não houver mudança acionável, e
notifica apenas bloqueio, mudança de estado, conclusão, falha ou decisão necessária.
Quando todas as entregas estiverem `integrated` ou `deferred`, reporte o escopo final e
pause automation (ou delete it, se esse era o acordo). Não deixe uma automação ativa
apenas porque a coordenação terminou.

## Exemplo compacto

Inventário: papéis, UI administrativa, webhook de assinatura, entitlement e cards de
dashboard. O roadmap necessário fica:

| Onda | Entregas independentes | Depende de | Saída |
| --- | --- | --- | --- |
| planejamento | contratos de papéis, webhook e métricas | decisões externas | contratos fechados |
| 1 | roles API; webhook; metrics API | planejamento | testes/contratos aceitos |
| 2 | admin UI; entitlement; dashboard cards | roles; webhook; metrics, respectivamente | smoke ou revisão prevista |
| 3 | revisão, smoke, PR | implementações concluídas | PRs com estado efetivo |
| 4 | merge | confirmação explícita por PR | integração observável |

Onda 1 é paralela somente se os três write sets e contratos forem independentes; a
onda 4 não é automática mesmo com todos os checks verdes.
