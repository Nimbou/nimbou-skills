# doc-pop — Deliverables

Referência de consulta de `doc-pop`. Leia depois que os dois testes passarem e antes de escrever qualquer arquivo.

**1. Markdown** — for the person to review: identification, objective, scope, definitions
and acronyms, responsibilities, numbered steps (with owner, nature, deadline, documents
and routing), process endings, pending items.

**The markdown is a mapping record, not a POP.** It has no code, no version, no approval;
it must not be printed and signed as a norm, circulated as a current procedure, or
presented to an audit as a published POP. If asked to sign it as a POP, refuse and
explain — banning Word and PDF is worthless if the markdown takes the same seat.

Saying this in the chat is not enough: the markdown is the artifact that walks away, and
the warning has to walk with it. **Open every markdown with this block, verbatim:**

```
> ⚠️ **Isto NÃO é um POP.** É o registro do que foi mapeado, para conferência.
> Não tem código, não tem versão e não tem aprovação. Não deve ser impresso e
> assinado como norma, circulado como procedimento vigente, nem apresentado a
> auditoria como POP publicado. O documento oficial é gerado pelo sistema a
> partir do JSON.
```

The same reasoning that makes the JSON markers structural applies here: a warning left
only in the conversation disappears the moment the file is copied somewhere else.

**Number the markdown steps to match the JSON `id`s** (step 7 ↔ `e7`). The person signs
off on the markdown and the quality team imports the JSON: if they diverge, nobody
notices.

**2. JSON** — business vocabulary, never implementation vocabulary:

```json
{
  "versaoFormato": "1.0",
  "processo": {
    "titulo": "Reembolso de Despesa",
    "objetivo": "...",
    "abrangencia": "...",
    "textoProposto": ["objetivo", "abrangencia"],
    "setorResponsavel": "Financeiro",
    "aprovadorPop": null,
    "normaInterna": null,
    "mapeadoPor": { "nome": "...", "cargo": "...", "setor": "..." },
    "mapeadoEm": "2026-07-22"
  },
  "papeis": [
    { "id": "colaborador", "nome": "Colaborador", "tipo": "pessoa" },
    { "id": "financeiro", "nome": "Analista Financeiro", "tipo": "setor" },
    { "id": "fornecedor", "nome": "Fornecedor", "tipo": "externo" },
    { "id": "sistema", "nome": "Sistema de Gestão de Projetos", "tipo": "sistema" }
  ],
  "etapas": [
    {
      "id": "e2",
      "nome": "Conferir previsão no projeto",
      "descricao": "Verifica se a despesa tem previsão no orçamento do projeto.",
      "executadoPor": "financeiro",
      "natureza": "decisao",
      "prazo": null,
      "documentosGerados": [],
      "saidas": [
        { "condicao": "Sem previsão", "vaiPara": "e3" },
        { "condicao": "Com previsão", "vaiPara": "e4" }
      ]
    },
    {
      "id": "e6",
      "nome": "Gerar Recibo de Reembolso",
      "descricao": null,
      "executadoPor": "sistema",
      "natureza": "automatica",
      "documentosGerados": [{ "nome": "Recibo de Reembolso", "sigla": "RRB" }],
      "saidas": [{ "condicao": null, "vaiPara": "e7" }]
    },
    {
      "id": "e10",
      "nome": "Realizar lançamento contábil",
      "descricao": null,
      "executadoPor": "contabilidade",
      "natureza": "manual",
      "saidas": [],
      "encerraProcesso": true,
      "resultadoFinal": "Processo encerrado"
    }
  ],
  "definicoes": [{ "termo": "RRB", "significado": "Recibo de Reembolso" }],
  "pendencias": [
    { "campo": "aprovador", "etapaId": null, "descricao": "Aprovador do POP não informado" },
    { "campo": "prazo", "etapaId": "e3", "descricao": "Prazo de correção não informado" }
  ],
  "observacoesDeMelhoria": [
    {
      "etapaIds": ["e3", "e4"],
      "descricao": "Devolução não tem prazo nem regra de arquivamento: se o candidato não reenviar, fica aberta indefinidamente."
    }
  ]
}
```

**Closed vocabulary:**

- `natureza`: `manual` | `automatica` | `espera` | `decisao`. It describes **what the step
  does**, not who runs it — a decision taken by the system is `decisao` with
  `executadoPor` pointing at the system, never `automatica`.
- `papeis[].tipo`: `pessoa` | `setor` | `sistema` | `externo` | `orgao` (conselho,
  comissão, colegiado) | `outro`. If nothing fits, use `outro` and explain in
  `tipoObservacao` — **never force the least-wrong label without recording it**, because
  in the JSON the accommodation becomes indistinguishable from the real thing.
- `pendencias[].campo`: `aprovador` | `normaInterna` | `prazo` | `responsavel` |
  `documento` | `descricao` | `vocabulario` (unconfirmed acronym or system name) |
  `destino` (decision outcome with nowhere to go — blocks the JSON) | `outro`
- `executadoPor`: a single role id, or an array when the step is genuinely co-executed
  (a term signed by two parties, a joint inspection). Co-execution is ordinary in
  institutional processes — do not bury the second party in `descricao`.
- `saidas[].vaiPara`: the id of the next step, or `null` when the branch exists in real
  life and leads nowhere. `null` always comes with a `pendencias` entry of
  `campo: "destino"`.
- `textoProposto`: fields where you **added meaning** — objective, scope, description.
  Labelling a step from the person's own words needs no mark, provided the label appears
  in the mirror and they confirm it. **Use their words:** if they said "faltando
  documento", do not write "pendência documental" — it is broader and silently changes
  the rule.
- `descricao`: use `null` when the person did not describe the step. Do not fill it to
  look complete — your text is what becomes norm unnoticed.
- `textoProposto` also exists **per step**, for `descricao` and `resultadoFinal`. The rule
  is affirmative, not just about empty fields: **every non-`null` `descricao` you phrased
  goes into the step's `textoProposto`.** Turning "eu olho se é elétrica ou hidráulica"
  into third person does not count; composing a sentence out of scattered answers does.
  Without the mark those fields reach the quality team carrying the same weight as the
  person's own words.
- `observacoesDeMelhoria[]`: objects with `etapaIds` + `descricao`. A finding that
  travels as loose text is a finding nobody can locate — the same reason the pending
  markers had to become structural. Every cycle flagged in Test 1's second pass belongs
  here, pointing at the steps that form the loop.
- Empty `saidas` + `encerraProcesso: true` marks an ending. Every step needs an outcome
  or an ending — that is Test 1 expressed as data.

**Unknown is not the same as non-existent.** "Não sei o prazo" is a `prazo: null` **plus**
a `pendencias` entry — someone can still answer it. "Não tem prazo" is a `prazo: null`
**without** a pending entry, recorded in `observacoesDeMelhoria` — there is nothing to
find out, the rule simply does not exist. Both look identical in the field; only the
company they keep tells them apart.
