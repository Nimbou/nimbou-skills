---
name: roadmap-orchestration
description: Coordene entregas, tarefas Codex e PRs autorizados em um roadmap com dependências reais.
---

# Roadmap Orchestration

Transforme o material em entregas necessárias. Uma entrega só entra no roadmap se
contribuir para o resultado autorizado, resolver uma dependência real ou tornar uma
entrega verificável.

**Anuncie no início:** “Estou usando a skill `roadmap-orchestration` para montar ou
retomar este roadmap.”

## Quando usar e rotear

| Situação | Ação |
| --- | --- |
| Ideia ainda ambígua ou escopo grande novo | Feche o desenho com `nimbou-skills:idea` ou `nimbou-skills:feat-spec` antes de prometer execução. |
| Mudança fullstack pequena | Use `nimbou-skills:change-plan`; não replique seu plano. |
| Plano por ondas já aprovado | Entregue a execução para `nimbou-skills:executing-plans`. |
| Uma entrega Nuxt acabou de ser construída | Use `nimbou-skills:browser-smoke` no ponto de smoke definido no roadmap. |
| Usuário quer mesclar um PR | Use `nimbou-skills:merge-pr`; esta skill nunca mescla. |
| Trabalho independente sem roadmap | Use `nimbou-skills:dispatching-parallel-agents`, apenas se houver autorização para delegar. |

Leia [references/operating-model.md](references/operating-model.md) antes de criar ou
alterar um roadmap. Leia [references/evaluations.md](references/evaluations.md) quando
for validar, ensinar ou auditar a aplicação desta skill.

## Gate de autorização

Planejar, analisar dependências e recomendar próximos passos são leitura/organização.
Criar tarefa Codex, iniciar ou enviar mensagem a uma tarefa, abrir PR, criar ou reativar
automação, habilitar auto-merge e mesclar são mutações distintas. Mostre as unidades
afetadas e obtenha autorização explícita para a ação específica; uma autorização de
criação não inicia tarefa, uma de acompanhamento não mescla, e uma de PR não habilita
auto-merge.

## Execução

1. Inventarie objetivo, entregas verificáveis, exclusões, fonte, evidência e
   incertezas. Pergunte somente o que altera entrega, ordem ou permissão.
2. Modele dependências reais e frentes realmente independentes. Dependência incerta é
   `blocked`, não uma aresta inventada.
3. Publique o registro de ondas, estados, bloqueios e modelos/esforços do modelo
   operacional. Mantenha planejamento, implementação, revisão, smoke, PR e merge
   separados.
4. Antes de criar algo, reconcilie tarefas e PRs existentes. Recomende as candidatas;
   crie/dispare somente as unidades autorizadas.
5. Na retomada, reconcilie e relate primeiro. Não inicie ondas, envie mensagens ou
   reative automações sem nova autorização. Ao concluir o escopo, pause/remova a
   automação autorizada de acompanhamento.

Nunca force paralelismo por contagem; contrato, write set, ambiente exclusivo ou
decisão aberta mantêm a ordem. Nunca mescle silenciosamente: exiba o estado efetivo do
PR e peça confirmação explícita via `merge-pr`.

## Economia de contexto

Guarde identificadores e evidências curtas, não históricos completos. Faça snapshots
compactos e só acompanhe novamente diante de mudança acionável. Registre modelos e
esforços diferentes para planejamento e execução conforme
[references/operating-model.md](references/operating-model.md). O teto é
`gpt-6-sol`/`medium`; uma decisão de arquitetura, dependência ou merge que não caiba
nesse teto precisa de escopo menor ou mais evidência, sem escalada de modelo.

## Saída mínima

Objetivo/exclusões, entregas necessárias, ondas, bloqueios/evidências, configuração de
planejamento e execução, registro de tarefas/PRs, ações aguardando autorização e a
próxima decisão humana. Grave o roadmap no local de planejamento do projeto apenas
quando o usuário pedir um artefato persistente.
