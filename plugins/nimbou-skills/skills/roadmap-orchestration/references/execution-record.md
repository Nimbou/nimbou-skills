# Registro compartilhado: `execucao.json`

Contrato de dados para o [núcleo de execução](execution-core.md). Um registro por
plano, em `docs/plans/<slug>/execucao.json`; o pai é seu único escritor.
`plano.json`, PDF e plano técnico continuam sendo as fontes aprovadas. O registro
coordena progresso, não substitui o conteúdo de gestão nem os contratos da stack.

## Campos

- `schema_version: 1`, `plan_id` estável, `revision` crescente e `updated_at` ISO-8601.
- `source`: tipo (`action-plan`/`roadmap`), caminho absoluto, versão e escopo ativo.
- `objective`, `exclusions`, `global_criteria`: resultado e evidência global exigida.
- `state`: `proposed`, `running`, `waiting`, `blocked`, `paused`, `completed`, `stopped`.
- `parent`: `threadId` real e `hostId` observado; nunca use ID temporário como real.
- `authorization`: pedido literal, referência à mensagem humana, ações/itens
  abrangidos, limites, validade e eventual revogação. Ausência não é autorização.
- `monitor`: ID/estado retornados, alvo pai, `interval_minutes: 30`, último check.
- `milestones`: IDs estáveis, referência à fonte, critérios, dependências, resultado
  verificado, estado, responsável, atividade e evidências. Inclua `write_sets`,
  ambiente e checkout para código. Não derive ID da posição atual de uma lista.
  `kind` é `automatic`, `human` ou `mixed`; o último combina `child` e `human_actions`.
- `human_actions`: ID por ação, setor exato, critério, esforço, prazo, tarefa FAEPEN
  e estado/evidência observados. Cada ação pertence a um marco.
- `operations`: intenções e resultados de efeitos externos. `operation_key` é
  estável por plano/item/ação/tentativa; `outcome` é `pending`, `confirmed`, `failed`
  (sem efeito comprovado) ou `unknown`. A chave facilita reconciliação; não invente
  um parâmetro de idempotência em uma API que não o oferece.
- `decisions`: mudanças de escopo, bloqueios, autoria humana, próximos passos.

Campos de identidades só aparecem após retorno real. Use `null` para desconhecido;
não fabrique UUID, data, equipe ou evidência. No child, registre `threadId` ou
`clientThreadId` pendente, modelo/esforço, checkout, `result_path`, cursor de leitura
e status observado. `evidence` contém referência acessível, critério coberto,
resultado da verificação, data e verificador pai; um texto “pronto” não basta.

O `result.md` da filha contém o resultado e, quando houver mensagem de retorno,
`callback`: `operation_key`, alvo pai, referência à autorização humana conferida,
`outcome` (`pending`, `confirmed`, `unknown`) e resposta/evidência curta. A filha
persiste essa intenção antes de enviar, atualiza o próprio arquivo depois e não
edita o registro canônico. O pai incorpora a chave/resultado em `operations` ao
reconciliar. O follow-up pode disparar um turno; o pai deduplica pela chave antes
de despachar. Sem autorização verificável ou retorno certo, o arquivo e o resultado
final permanecem como canal recuperável, sem repetição automática da mensagem.

## Exemplo de plano misto antes do despacho

Os três marcos usam IDs estáveis; o final só poderá ficar `ready` após os dois
predecessores estarem `completed`. Identidades e autorização abaixo são placeholders
de formato, não permissão para criar trabalho real.

```json
{
  "schema_version": 1,
  "plan_id": "cadastro-fornecedores",
  "revision": 1,
  "updated_at": null,
  "source": {
    "kind": "action-plan",
    "path": "<caminho absoluto>/docs/plans/cadastro-fornecedores/plano.json",
    "version": 1,
    "active_scope": ["diagnostico", "validacao-humana", "consolidacao"]
  },
  "objective": "Cadastro conferido e relatório final entregue",
  "exclusions": ["Alterar dados de produção"],
  "global_criteria": ["Relatório final acessível com diagnóstico e validação humana"],
  "state": "proposed",
  "parent": {"threadId": null, "hostId": null},
  "authorization": {
    "user_request": null,
    "message_ref": null,
    "actions": [],
    "scope": [],
    "limits": {"max_parallel_children": 2, "max_additional_attempts": 2},
    "revoked": false
  },
  "monitor": {"id": null, "state": "not-created", "interval_minutes": 30},
  "milestones": [
    {
      "id": "diagnostico",
      "source_ref": "plano.json#marcos[id=diagnostico]",
      "kind": "automatic",
      "outcome": "Relatório de inconsistências disponível",
      "criteria": ["Todos os registros do recorte aprovado foram conferidos"],
      "depends_on": [],
      "state": "proposed",
      "child": null,
      "evidence": []
    },
    {
      "id": "validacao-humana",
      "source_ref": "plano.json#marcos[id=validacao-humana]",
      "kind": "human",
      "outcome": "Setor confirmou os documentos exigidos",
      "criteria": ["Lista conferida pelo setor com evidência acessível"],
      "depends_on": [],
      "state": "proposed",
      "human_actions": [
        {
          "id": "conferir-documentos",
          "team": null,
          "effort": "PEQUENA",
          "dueDate": null,
          "state": "proposed",
          "criteria": ["Lista de documentos aprovada disponível"],
          "task": null,
          "evidence": []
        }
      ],
      "evidence": []
    },
    {
      "id": "consolidacao",
      "source_ref": "plano.json#marcos[id=consolidacao]",
      "kind": "automatic",
      "outcome": "Relatório final disponível",
      "criteria": ["Incorpora diagnóstico e documentos confirmados pelo setor"],
      "depends_on": ["diagnostico", "validacao-humana"],
      "state": "proposed",
      "child": null,
      "evidence": []
    }
  ],
  "operations": [],
  "decisions": []
}
```

## Invariantes de retomada

1. IDs únicos; cada dependência referencia um marco existente e o grafo não tem
   ciclos. Toda ação humana tem ID único no marco. Corrija o registro antes de agir.
2. Versão/caminho da fonte corresponde ao escopo autorizado. Mudança de objetivo ou
   destinatário requer decisão, não apenas incremento de `revision`.
3. `ready` exige entradas, autorização e dependências `completed`; `completed`
   exige evidência verificada de todos os critérios, inclusive das ações humanas.
4. Uma operação `pending`/`unknown` impede repetir aquele efeito externo. Uma chave
   confirmada aponta à identidade canônica, mesmo que a resposta tenha se perdido.
5. Tarefa humana `CONCLUIDA` e chat filho finalizado são observações externas, não
   equivalentes ao estado `completed` do marco.
6. `completed` do plano exige critérios globais e todos os marcos do escopo vigente
   comprovados. Exclusões decididas ficam no histórico; fechamento sem objetivo
   atingido é `stopped`. O ID da automação é preservado após pausar para pós-validar.
