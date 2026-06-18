# Approval Document — structure, translation, and identity

Read this in full before authoring `assets/template.html`. It defines (1) what each
section contains and which spec source feeds it, (2) how to rewrite Gherkin into
business language, and (3) the FAEPEN visual identity and chip/state colours.

The goal is a document a **non-technical sponsor** reads end-to-end and signs. If a
line would only make sense to an engineer, it does not belong here.

---

## 1. Section map (source → section)

Mirror this order. Omit a section only when the spec genuinely has nothing for it
(e.g. greenfield domains have no "today × proposed").

| # | Section | Source in the spec | Notes |
| --- | --- | --- | --- |
| 1 | **Cover** | `domain.md` title + first paragraph of *Contexto* | Brand mark + org, kicker "Especificação de Domínio · Para aprovação", `<h1>` = domain name in business words, one-line serif subtitle, meta line with date + "Aprovação: \<role\>". Add a scope pill ("Etapa X de Y · …") only when the spec frames the domain as one stage of a larger program. |
| 2 | **Para que serve este documento** | *Contexto* + *Escopo* | A `.lead` box: what the reader is approving, plus a muted scope note (e.g. "primeira de duas etapas") when applicable. |
| 3 | **Contexto / visão do fluxo** | *Contexto* | Short narrative. Optional `.states` chip row: for a staged flow, highlight the current step and grey the rest; for an ordering/invariant domain, render the chain it enforces instead of program steps; omit it when there is no flow. |
| 4 | **O que muda** (Hoje × Proposto) | any current-vs-proposed contrast in the spec | A `.compare` table. **Include** whenever a contrast can be sourced — even from one line of prose (e.g. "substitui o caminho manual antigo"), not only a literal "Hoje/Passa a ser" block. **Omit** only when the domain is wholly new behaviour. Never fabricate a contrast. |
| 5 | **Quem participa** | *Fronteira de responsabilidade* + roles named in *Contexto* | One `.role` row per actor, in business terms (Coordenador, Bolsista, Sistema, …). |
| 6 | **Glossário** | *Termos centrais* | Two-column table. Translate definitions; drop any code/entity wording. |
| 7 | **Estados e situações** | *Estados reais* + *Status derivados* | See §3 below. Keep real states and derived statuses in **separate** sub-blocks. If the domain declares no real states of its own, render only derived and rename the section to "Situações". |
| 8 | **Regras de negócio e cenários** | the `*.feature` files | The heart of the document. One `.rule` card per `Regra`, grouped under `<h3>` per feature/slice. See §2. |
| 9 | **Escopo** (incluso × fora) + pré-condições | *Escopo desta entrega* | A `.twocol` of `.box.in` / `.box.out`, plus any precondition line. |
| 10 | **Aprovação** | fixed template | Decision options, observações area, signature lines. See §4. |

A closing `footer.note` repeats the institution, domain, stage, date, and
"Documento para aprovação interna."

**Source by meaning, not by heading.** The "Source" column names the *typical*
`domain.md` section, but real specs vary: a domain may carry roles inside *Comandos
e decisões* instead of *Fronteira de responsabilidade*, or have sections the map
never lists (*Classificações que alteram o fluxo*, *Entidades de negócio*, *A cadeia
temporal*). Map that content to the nearest section by what it *means* — a
classification feeds the glossary or states; a command feeds a rule card or a role.

**Drop engineering-only context.** Cross-domain wiring (*Relacionamento com outros
domínios*, *Referências cruzadas*, a *Fronteira de responsabilidade* table of
"owner: which backend") is not for a sponsor — omit it even though the spec carries
it.

**Surface the core rule.** When a domain is an invariant or ordering (e.g. a date
chain `início ≤ emissão ≤ fim`), state it once in one plain business line near the
top of the Contexto — that single rule is the most important thing the reader
approves; do not leave it buried inside scenarios.

---

## 2. Gherkin → business translation rules

The `.feature` files are written for engineers. Rewrite them; never transcribe.

- **`Funcionalidade:` / `# language: pt` / actor framing** → drop the framing.
  Carry the intent into the section narrative if useful.
- **`Regra:`** → a rule card header (`.rule > .rh`), phrased as a plain business
  rule ("Regra: bolsista já cadastrado é reaproveitado, sem convite").
- **`Cenário:`** → a `.sc` block:
  - `.t` (title) = a short, readable scenario name;
  - `.g` (gloss) = **one or two** business sentences derived from the
    `Dado`/`Quando`/`Então` steps. Keep **Dado / Quando / Então** as bolded
    connective words inside the sentence, but rewrite the step content into
    business language. Collapse multiple `E`/`Dado` steps into one clause.
- **States** — replace every `UPPER_CASE` token with a readable Title-Case label
  (`PENDENTE` → **Pendente**, `VINCULADO` → **Vinculado**) and bold it as a status
  word. Use the chip styles (§3) when listing them.
- **Strip all technical surface** — no endpoints, verbs, status codes, DTO/field
  names, class/controller/use-case/repository names, Prisma models, tables,
  columns, SQL, migrations, tokens, or internal identifiers.
- **Translate internal terms** to their business equivalent — e.g. "wizard público"
  → "assistente de cadastro guiado", "dedup por CPF" → "reaproveita o cadastro
  existente em vez de duplicar". This also covers internal aggregate names, acronyms,
  and codes: "provisão `SCHOLARSHIP_GRANT`" → "parcela", "SPB" → "Solicitação de
  Pagamento de Bolsa". Spell an acronym out once, then use the plain noun.
- **Scenario Outlines** (`Esquema do Cenário` + `Exemplos:`) → collapse the whole
  examples table into **one** scenario card stating the variation in business words
  ("a mesma exigência vale para os três tipos de documento"). Never dump the rows.
- **Drop example/fixture dates and literals** — concrete values in steps
  (`15/12/2025`, `R$ 1.000,00`) are test fixtures, not business rules. Express the
  rule relationally ("antes do início do projeto", "acima do saldo disponível")
  instead of transcribing the value.
- **Keep business-relevant facts** — deadlines/validity, who does what, what gets
  blocked, and the resulting status. Drop anything that only matters to code.

Worked example (from `auto-cadastro-bolsista.feature`):

> ```gherkin
> Cenário: Convite expirado
>   Dado um convite de bolsista EXPIRADO
>   Quando o bolsista abre o link
>   Então o acesso é recusado
>   E é orientado a solicitar um novo convite
> ```

becomes

> **Convite expirado** — **Quando** o convite expirou, **então** o acesso é
> recusado e o bolsista é orientado a solicitar um novo convite.

---

## 3. States and derived statuses

Source these from `domain.md`. **Do not merge them** — the reader should see real
states (an entity's lifecycle) apart from derived statuses (situations computed
from data).

- **Real states** (*Estados reais*) → render each lifecycle as a `.states` chip row
  with `→` arrows between transitions, plus a short `ul.small` legend describing
  each state in one business sentence.
- **Derived statuses** (*Status derivados*) → render as a separate `.states` row or
  a small list, clearly labelled as derived situations, each with its plain-language
  condition (no code).
- **Domain with no real states of its own** — panel, projection, and invariant
  domains often say so verbatim ("este domínio não introduz estados próprios", "são
  leituras derivadas dos dados"). When so, **omit the real-states block entirely**,
  rename the section to "Situações", and render only the derived statuses. Do not
  invent a lifecycle and do not pull real states from other domains into this
  document.

### Chip colour semantics

| Class | Use for |
| --- | --- |
| `chip gold` | pending / in-progress / intermediate / current step |
| `chip green` | good terminal / active / completed / linked |
| `chip red` | error / expired / blocked-bad |
| `chip muted` | cancelled / inactive / a future step out of this scope |

Use `.arrow` (`→`) between chips to show transitions; separate independent
transition lines with `&nbsp;&nbsp;|&nbsp;&nbsp;`.

---

## 4. Approval block

A `.approval` card with:

1. one short declaration line ("Declaro ter revisado as regras de negócio acima
   referentes a **\<domínio\>** e registro minha decisão:");
2. three decision options as checkbox chips: **Aprovado**, **Aprovado com
   ressalvas**, **Ajustes necessários**;
3. an "Observações / ressalvas:" label above a blank `.obs` writing area;
4. signature rows (`.sigrow`/`.sigline`): **Nome**, **Cargo — \<role\>**, then on a
   second row **Assinatura** and a narrower **Data** field.

This block is fixed boilerplate; only the domain name and approver role change.

---

## 5. Visual identity (FAEPEN)

These tokens are already wired into `assets/template.html` `:root`. Keep them unless
the user asks to rebrand.

| Token | Value | Role |
| --- | --- | --- |
| `--green` | `#2C5937` | institutional green — H1/H2, table headers |
| `--green-deep` | `#132819` | dark green — H3, strong labels |
| `--gold` | `#C4922A` | gold — H2 underline, accents, scenario left border |
| `--neutral` | `#F8F6F3` | off-white — lead/boxes background |
| `--ink` | `#2D2A26` | body text |

- **Titles** in serif (`Georgia, "Times New Roman", serif` fallback — Source Serif
  may be absent).
- **Body** in sans (`"Inter", "Helvetica Neue", Arial, sans-serif` — Inter may be
  absent; the fallback prints fine).
- **Page**: A4, margins `18mm 16mm 16mm`, `print-color-adjust: exact` so the
  coloured chips and headers survive printing.
- Use `.pgbreak` to push long content (e.g. the states + rules block) onto a fresh
  page so the cover and front matter stay clean.
