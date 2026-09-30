---
name: roadmap-orchestration
description: Coordene entregas, tarefas Codex e PRs autorizados em um roadmap com dependências reais, incluindo execução autônoma e participação humana.
---

# Roadmap Orchestration

Transforme o material em entregas necessárias. Uma entrega só entra no roadmap se
contribuir para o resultado autorizado, resolver uma dependência real ou tornar uma
entrega verificável. Planejamento e execução compartilham IDs, critérios e evidências
com `nimbou-skills:action-plan`.

**Anuncie no início:** “Estou usando a skill `roadmap-orchestration` para montar ou
retomar este roadmap.”

## Modos e roteamento

**Planejar/reconciliar:** inventarie fontes, objetivo, exclusões, entregas,
dependências reais e incertezas. Pergunte somente o que altera entrega, ordem ou
permissão. Leia [references/operating-model.md](references/operating-model.md).
Organizar ou aprovar um roadmap não inicia trabalho externo.

**Executar/acompanhar:** diante de autorização explícita para execução com chats
persistentes, acompanhamento e encaminhamento humano, leia obrigatoriamente o
[núcleo compartilhado de execução](references/execution-core.md) e o registro de
dados que ele referencia. O pai delega marcos, confere retorno das filhas, encaminha
ações humanas ao MCP FAEPEN e continua o plano com heartbeat de 30 minutos. Retome
as ações já autorizadas sem exigir confirmação a cada onda ou despertar.

| Situação | Ação |
| --- | --- |
| Ideia ainda ambígua ou escopo grande novo | Feche o desenho com `nimbou-skills:idea` ou `nimbou-skills:feat-spec`. |
| Mudança fullstack pequena | Use `nimbou-skills:change-plan`; preserve seu plano. |
| Plano de ação administrativo aprovado | Execute os marcos pelo núcleo comum; não exija ondas de código. |
| Marco técnico com plano por ondas aprovado | Entregue sua implementação a `nimbou-skills:executing-plans`; preserve `prose-execution.md`. |
| Entrega Nuxt construída | Use `nimbou-skills:browser-smoke` no ponto de smoke definido. |
| Usuário quer mesclar um PR | Use `nimbou-skills:merge-pr`; esta skill nunca mescla. |
| Trabalho independente sem roadmap | Use `nimbou-skills:dispatching-parallel-agents`, se autorizado. |

## Coordenação

Reconcilie chats, tarefas humanas, PRs e automações antes de criar ou despachar.
Registre identidades reais, autorização vigente, checkout, critérios e evidências.
Não force paralelismo: contrato, write sets, ambiente exclusivo ou decisão aberta
mantêm a ordem. Não trate chat finalizado, tarefa humana concluída ou CI verde como
prova automática de que o marco ou o objetivo foi atingido.

Criação de chat já inicia a tarefa. Preserve o limite de modelos:
`gpt-6-sol`/`medium` para decisões abertas, comportamento e revisão;
`gpt-6-luna`/`high` para trabalho mecânico delimitado. A configuração excepcional
Luna/max do controller técnico segue o handoff existente, sem alterar seus workers.

Planejamento só grava artefato quando solicitado. Execução exige registro canônico
em `docs/plans/<slug>/execucao.json`, ou no destino escolhido. Publique mudanças,
bloqueios e próxima ação, permanecendo silencioso no monitoramento sem mudança
acionável. Encerre o acompanhamento somente com critérios globais comprovados ou
com pausa/encerramento explícito registrado, conforme o núcleo comum.

Leia [references/evaluations.md](references/evaluations.md) para validar, ensinar ou
auditar o comportamento. Saída mínima: objetivo/exclusões, entregas, dependências,
estados/evidências, registro de chats/tarefas/PRs, autorização, acompanhamento e
próxima ação ou decisão humana.
