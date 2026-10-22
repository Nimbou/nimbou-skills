# Scope control and delivery summary

Required for every development plan, including revisions, small changes, and plans written by a worker. This contract supplements each planner's document format and self-review; it does not change technical task fields or authorize execution.

## Before writing tasks

Establish the scope from the user's request, explicit exclusions, and decisions already approved in the conversation. Cite the request or approved artifact/section for each planned capability. A pre-existing design, generated spec, example, or repository convention is not evidence of user approval by itself. A later explicit restriction overrides broader earlier scope.

Classify candidate work:

- **Requested functionality:** capabilities and behavior changes traceable to that scope, including approved changes and removals.
- **Technical necessities:** the smallest implementation, compatibility edits, and permitted verification needed to deliver that functionality. Explain which requested behavior requires each item. Ordinary implementation choices do not need another approval.
- **Out-of-scope suggestions:** optional improvements without that authorization. Keep them out of executable waves, task headings, checklists, acceptance criteria, and execution handoffs. List only relevant suggestions already encountered; do not invent extras to fill a section.

Do not disguise a new business rule, permission model, notification, export, dashboard, or independent refactor as a technical necessity. If delivery truly depends on an unresolved product decision or scope expansion, explain the concrete dependency and ask before closing the affected plan. Continue independent planning where useful; do not mark the plan execution-ready while that decision is open. Optional suggestions never block delivery of the requested scope.

## Reconcile before delivery

Review both directions: every authorized requirement has tasks, and every task belongs to an authorized requirement or its justified technical necessity. Check task bodies, contracts, migrations, tests, and post-execution steps, not only titles. Remove unauthorized extras even if the plan is already written or an older artifact contains them. Technical guidelines govern how requested work is implemented; they do not authorize unrelated cleanup.

For a joint plan, consolidate backend and frontend work into user capabilities without listing the same feature twice. Do not hide distinct capabilities under an umbrella such as "complete management" or "improvements".

## Required saved section and chat response

After self-review, include `## Resumo do que será entregue` near the start of the saved plan, after its required header and before execution waves. Also send the summary in the final chat response after generating or revising plans, alongside their links. A file link, task identifier, list of files, or report sent only to the controller does not replace the user-facing summary. Describe planned delivery in the future tense, never as already implemented.

Use the user's language and these three groups (write "Nenhuma" when a group is empty):

1. **Funcionalidades solicitadas:** enumerate all distinct capabilities that will be added, changed, or removed; explain the observable outcome and cite its request or approved decision. In the saved plan, map each item to its tasks or waves.
2. **Necessidades técnicas:** summarize necessary supporting work separately, with a short justification linked to the functionality it supports.
3. **Sugestões fora do escopo:** name relevant excluded extras and state that they are not included in execution and require an explicit user request before inclusion.

When multiple plans are delivered, cover every plan with a labeled summary or one consolidated summary identifying the owning plan for each capability. After a revision, refresh the complete summary and briefly identify what changed. For a blocked draft, label it as a draft and name the unresolved decision; do not promise uncertain capabilities as agreed delivery.

Example for "add a status filter to the orders list":

- **Funcionalidades solicitadas:** a lista de pedidos permitirá filtrar por status, conforme o pedido do usuário (tarefas 1–3).
- **Necessidades técnicas:** a consulta receberá o status selecionado e os testes focados verificarão o filtro.
- **Sugestões fora do escopo:** exportação CSV presente no desenho antigo ficará fora da execução; só será incluída se solicitada.

## Worker and controller handoff

The worker returns the complete summary with the saved plan. The controller verifies it against the plan and the user's scope, then shows it in chat before any otherwise-authorized execution handoff and includes it in the final response. Do not require a new blanket approval when scope is already authorized. If an essential scope decision is unresolved, keep the plan as a draft and ask that specific question instead of dispatching execution.
