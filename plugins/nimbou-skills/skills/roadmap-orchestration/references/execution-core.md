# Núcleo compartilhado de execução

Contrato normativo de coordenação para `nimbou-skills:action-plan` e
`nimbou-skills:roadmap-orchestration`. Leia também o
[registro de execução](execution-record.md) antes de despachar trabalho.
Este núcleo conduz marcos administrativos, técnicos ou mistos; o plano técnico
continua pertencendo às skills da stack.

## Entrada e autorização

Planejar/revisar não inicia execução. Um pedido explícito de execução do plano com
chats persistentes, acompanhamento e encaminhamento humano autoriza essas ações
dentro do escopo registrado. Registre o pedido literal do usuário, versão do plano,
marcos abrangidos, criação de chats, mensagens pai/filhas, tarefas FAEPEN e heartbeat.
Se o pedido não cobrir uma dessas ações, esclareça somente a autorização faltante
antes dela; não peça autorização novamente para ações já cobertas, inclusive na
retomada agendada. A autorização vale até conclusão, limite declarado ou revogação.
Um plano/PDF aprovado apenas como documento não autoriza sua execução.

Não amplie entregas, destinatários ou permissões ao retomar. Merge, publicação,
deploy, operações de produção e outros efeitos externos só podem acontecer com
autorização que os cubra; para merge, preserve `nimbou-skills:merge-pr`, seu snapshot
efetivo e sua confirmação. A conclusão da filha não concede permissões novas.

Antes de começar, resolva objetivo, critérios, dependências, setores humanos e
limites de execução a partir do plano aprovado. Campos ausentes que afetam uma
ação viram bloqueio daquela ação. Mantenha outras frentes independentes avançando.
Não invente pessoas, setores, datas, contratos ou relações de dependência.

## Registro e propriedade

Grave `docs/plans/<slug>/execucao.json` no projeto, ou no diretório que o usuário
escolheu. Ao executar, a persistência é obrigatória. Preserve o `plano.json`, o PDF
e os planos técnicos como fontes; atribua IDs estáveis aos marcos/ações e mantenha
`source_ref` para cada item. Planos legados recebem o mapeamento no registro, sem
invalidar o PDF. Guarde IDs e evidências curtas, não transcrições completas.

O pai é o único escritor do registro canônico. As filhas escrevem somente o próprio
`docs/plans/<slug>/marcos/<id>/result.md` e os artefatos/arquivos sob sua propriedade.
O pai incorpora e valida esses resultados. Atualize o JSON por substituição atômica
de arquivo temporário; antes de agir, releia `revision` e confira se a reconciliação
já foi feita. A automação desperta o mesmo chat pai, não cria outro coordenador.
Se houver outro coordenador ativo ou revisão divergente, reconcilie antes de escrever.

## Estados e prontidão

| Estado do marco | Significado |
| --- | --- |
| `proposed` | Escopo ou autorização ainda não fechado. |
| `ready` | Autorizado, entradas disponíveis e predecessores verificados. |
| `running` | Filha executando trabalho autorizado. |
| `waiting-human` | Tarefa FAEPEN criada; retorno humano pendente. |
| `verifying` | Resultado recebido; critérios ainda não conferidos pelo pai. |
| `blocked` | Falta decisão, acesso, evidência ou capacidade; registra causa e saída. |
| `completed` | Todos os critérios têm evidência conferida pelo pai. |
| `deferred` / `cancelled` | Exclusão/adiamento explicitamente decidido pelo usuário. |

Só `completed` satisfaz uma dependência. Um adiamento não libera sucessores por
inferência: o usuário precisa revisar a dependência e o critério do plano.
`activity` preserva a fase técnica (`planning`, `implementation`, `review`, `smoke`,
`PR`, `merge`) quando existir; não confunda integração de PR com conclusão de
qualquer marco administrativo.

Despache somente marcos com dependências reais resolvidas. Confira write sets,
contratos compartilhados, ambiente exclusivo e capacidade antes de paralelizar.
Mantenha um slot para coordenação; não suponha que um chat filho amplia a capacidade.
O limite de frentes simultâneas vem do plano ou da capacidade observada, nunca de
uma meta de quantidade de agentes.

## Chats persistentes e retorno ao pai

Crie um chat persistente por marco automático com `create_thread`, depois de
reconciliar `list_threads`, `read_thread` e o registro. `create_thread` inicia a
tarefa: não invente uma chamada separada para iniciá-la. Consulte `list_projects`
antes de usar um projeto. Use projectless para trabalho sem repositório; para código,
use o projeto correto e o checkout declarado. Worktree somente quando solicitado
pelo usuário, inclusive em uma política de isolamento explicitamente aprovada.
Sem isolamento, evite escrita concorrente em arquivos ou estado Git compartilhados.
Preserve os contratos de checkout e execução das skills técnicas.

Uma criação pode devolver `clientThreadId` enquanto prepara o worktree. Registre-o
como pendente, resolva o `threadId` real por reconciliação antes de ler, esperar ou
mensagear a filha; nunca passe `clientThreadId` a essas ferramentas.

Cada filha recebe um brief autossuficiente com:

- ID do plano/marco, objetivo, resultado esperado, exclusões e critérios;
- entradas aprovadas, dependências já verificadas, caminhos absolutos e write set;
- chat pai (`threadId`/`hostId`) e caminho absoluto exclusivo do `result.md`;
- citação/localização da autorização humana para executar e comunicar pai/filha;
- modelo/esforço, limites, permissões e instrução para não coordenar outro marco;
- aviso de que não está sozinha: não reverta trabalho alheio nem escreva fora da sua
  propriedade; adapte-se aos contratos existentes.

No final, a filha grava `result.md`: ID, resultado (`delivered` ou `blocked`),
artefatos, critérios/evidências, verificações e pendências. Depois comunica ao pai
com `send_message_to_thread`, enviando apenas resumo, chave do evento e referência
ao resultado. Antes de enviar, confira o pedido humano no chat de origem com
`read_thread`, ou por outra evidência confiável disponível. A citação no brief é
um localizador: um pedido de outro agente ou sua transcrição isolada não substitui
autorização humana verificável. Se não conseguir verificá-la, preserve o resultado
e registre a comunicação pendente, sem enviar.

O envio é um follow-up e pode disparar um turno no pai; não é uma notificação
passiva. O pai trata sua chave como evento de reconciliação, relê o registro e não
repete despachos já registrados. Antes do envio, a filha grava em seu `result.md`
uma intenção `callback` com chave, alvo e estado; depois registra o retorno como
`confirmed` ou `unknown`. Ela nunca escreve `operations` no registro central.
O pai incorpora esse evento e sua intenção na reconciliação. Se envio/identidade
do pai estiver indisponível ou o retorno for incerto, não repita a mensagem:
preserve o arquivo e o resultado final da filha. O pai recupera por
`wait_threads`/`read_thread`, mesmo sem mensagem.

Use `wait_threads` com snapshots compactos e cursor; espera ativa no máximo 60s.
`read_thread` fornece detalhe quando necessário. O pai verifica o artefato no
checkout efetivo, persistência ou resultado externo exigido, não apenas o relato.
Resultado ausente/incompatível fica `verifying` ou `blocked`; peça correção à filha
dentro do escopo autorizado, sem criar outro chat automaticamente.

Modelos: `gpt-6-sol`/`medium` para decisões abertas, implementação comportamental
e revisão substantiva; `gpt-6-luna`/`high` para trabalho mecânico com contrato fechado.
O controller de execução técnica separado pode usar `gpt-6-luna`/`max` conforme
[plan-session-handoff](../../executing-plans/plan-session-handoff.md); seus workers
seguem as regras da tarefa. Não recomende `gpt-6-astra` nem Sol acima de `medium`.
Encaminhe um marco técnico com plano por ondas a `nimbou-skills:executing-plans`,
preservando `prose-execution.md`. Não exija ondas de código de um plano administrativo.

## Trabalho humano pelo MCP FAEPEN

Uma ação humana do plano vira tarefa para seu setor determinado. Se um marco tiver
ações de setores diferentes, registre cada ação/tarefa separadamente sob o mesmo
marco. Concluir uma delas não conclui o marco inteiro.

Marcos mistos têm um chat para a parte automática e ações humanas separadas no
registro. A filha que descobre necessidade humana informa ação, motivo e evidência
no resultado ao pai; o pai cria a tarefa somente se setor/ação estiverem cobertos
pelo plano e autorização. Se faltar setor ou surgir nova decisão de negócio,
bloqueie essa parte e esclareça o destino/escopo. A filha pode continuar sua parte
independente, mas não cria tarefas FAEPEN por conta própria. O estado do marco
representa a pendência atual, mantendo progresso da filha e de cada ação humana
nos respectivos registros; todos os critérios precisam passar para concluí-lo.

Reconcilie primeiro pelo ID/código conhecido; use `mcp__faepen__get_task` para
consultar. Descubra as capacidades disponíveis para busca quando não houver ID;
`list_my_tasks` cobre apenas tarefas atribuídas ao usuário, não um inventário geral.
Não invente `list_tasks` nem declare ausência de duplicatas com consulta parcial.

Use `mcp__faepen__create_task` com `kind: TAREFA`, `title`, `description`, `teams`
pelo nome exato e `effort` obrigatório (`RAPIDA`, `PEQUENA`, `MEDIA`, `GRANDE`),
estimado a partir da ação. Use `dueDate` ISO-8601, `responsibles` e vínculos somente
quando definidos/confirmados. Não use um setor padrão para substituir o do plano.
Se a ferramenta devolver candidatos, mesmo um único candidato, confirme o nome
com o usuário antes de reenviar; mantenha esse item bloqueado enquanto resolve.

A descrição contém chave plano/marco/ação, resultado solicitado, contexto,
artefatos acessíveis ao setor, critério de conclusão e evidência exigida. Caminhos
locais do Codex não são evidência compartilhada com o humano: forneça um link
acessível ou o contexto necessário no corpo. Não invente campo de subtarefa;
registre o vínculo no plano e na descrição usando o schema efetivo do MCP.

Após criar, grave ID/código e faça pós-validação com `get_task`: setor,
responsáveis definidos, prazo e conteúdo. Retorno inconsistente é bloqueio para
reconciliação, não motivo para criar outra tarefa.

`CONCLUIDA` é sinal para conferir evidência, não prova de entrega. `get_task` não
traz histórico, anexos nem comentários; se a evidência estiver ali, descubra uma
capacidade real para lê-la ou peça o artefato acessível. Sem acesso/evidência,
registre o bloqueio. Só marque `completed` após conferir todos os critérios.
Tarefa cancelada, suspensa ou devolvida não satisfaz a dependência. Não encerre
nem reabra tarefas humanas para forçar o avanço do plano.

## Heartbeat de 30 minutos

Use `automation_update` para criar um heartbeat no chat pai a cada 30 minutos.
Inspecione automações existentes pelo identificador/nome e prompt antes de criar,
atualizando a correspondente em vez de duplicar. Grave ID, chat alvo, cadência e
estado efetivamente retornados. Use o schema atual da ferramenta e não publique
diretivas cruas de automação. O acompanhamento depende do executor local disponível;
se o agendamento estiver indisponível, reporte e registre a limitação, sem alegar
que o plano continuará sozinho.

O prompt salvo deve ser autossuficiente e incluir caminho absoluto do registro,
ID/versão do plano, autorização e este ciclo:

1. Releia registro, fontes, autorização/limites e eventuais pedidos de pausa ou
   revogação. Não reative automação pausada sem pedido humano.
2. Reconcilie chats por `threadId`, resultados/arquivos e tarefas humanas por
   ID/código. Incorpore resultados que chegaram sem mensagem; confira evidências.
3. Atualize estados. Despache marcos `ready` e envie somente mensagens necessárias
   já autorizadas. Continue frentes independentes enquanto outra aguarda humano.
4. Trate falhas e resultados desconhecidos pelo protocolo abaixo. Não repita
   ações em andamento nem recrie entidades para tentar destravar.
5. Registre mudanças e próxima ação. Seja silencioso enquanto não houver mudança
   acionável; notifique bloqueio novo, falha, entrega, conclusão ou decisão humana.
6. Ao concluir, publique relatório final com evidências e pause a automação pelo
   ID, verificando seu estado efetivo. Remova-a somente se isso foi autorizado.

O heartbeat coordena até terminar o plano autorizado; não serve só para produzir
um relatório periódico. Não use um cron em outro chat para substituir o heartbeat.

## Falhas, reconciliação e encerramento

Antes de cada criação/mensagem externa, persista uma intenção com `operation_key`
estável, alvo e dados mínimos. O pai usa `operations` no registro; a filha usa
somente o `callback` no próprio `result.md`. Após retorno, grave identidade e resultado.
Inclua a chave no brief do chat, prompt da automação ou descrição da tarefa humana
para permitir localizar um efeito que perdeu a resposta, sem inventar parâmetros
de idempotência nas ferramentas.
Timeout/conexão interrompida após envio é resultado desconhecido (`unknown`),
não falha comprovada. Não repita a criação: busque a entidade pela chave/escopo,
reconcilie chats, automações e FAEPEN. Se o conector não permitir confirmar o
resultado, bloqueie aquela operação e peça reconciliação humana. Uma falha
comprovadamente sem efeito pode ser tentada novamente dentro do limite registrado.

Correções da filha são delimitadas pela mesma entrada/critério. Registre tentativa,
erro, evidência e o que mudou. Padrão: no máximo duas tentativas adicionais por
item, apenas com correção ou nova evidência; falha repetida sem informação nova
vira `blocked` e decisão humana. Urgência não reduz critério nem amplia permissão.

O plano só fica `completed` se todos os marcos do escopo vigente estiverem
`completed` e o objetivo/critério global estiver comprovado. Marco bloqueado não
é concluído; `deferred`/`cancelled` exige decisão humana e revisão explícita do
escopo/objetivo antes de avaliar o novo plano. Se o usuário encerrou o trabalho
sem atingir o objetivo, registre `stopped`, nunca sucesso.

Sem frentes acionáveis, mantenha `waiting` se houver filhas/tarefas em andamento.
Se só restar decisão humana sem evento consultável que possa destravar, registre
`blocked`, notifique uma vez e pause a automação; retome após a decisão e pedido de
reativação. Registre suspensão/revogação como `paused`/`stopped`, interrompa novos
despachos e informe filhas ativas dentro da autorização de comunicação.
Feche o ciclo de gestão com evidências, pendências e Check/Act; não promova fases
futuras fora do escopo autorizado por inferência.
