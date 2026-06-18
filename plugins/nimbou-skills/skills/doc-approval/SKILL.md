---
name: doc-approval
description: Use this skill to generate a non-technical approval PDF for management or stakeholders from a domain spec (`docs/domain/<domain>/domain.md` + `*.feature`). Trigger when the user asks to "gerar PDF de aprovação", "documento de aprovação da gerência", "aprovação do stakeholder", or "doc-approval <domain>". Translates Gherkin scenarios into plain business Portuguese — no endpoints, DTOs, class names, code-level states, or Prisma details.
---

# Doc Approval

Generate an **executive approval document** (PDF) from a domain specification so a
non-technical decision-maker (e.g. Gerência Geral) can read it and **sign the
approval** before development starts.

The input is the engineering spec under `docs/domain/<domain>/` (`domain.md` plus
its `*.feature` files). The output is a styled, print-ready PDF written in plain
business language, plus the source HTML kept beside it for re-editing.

## When to use

Use when an approved or near-approved domain spec needs sign-off from a business
sponsor before work begins. The reader is a manager or stakeholder, **not** an
engineer: the document must carry the business rules and decisions, never the
implementation.

Do **not** use this skill to:

- write or change the domain spec itself (that is `doc-domain` / `doc-gherkin`);
- produce an HTTP contract (that is `doc-openapi`);
- explain code, architecture, or persistence to a technical audience.

## Arguments

Invoked with the target domain:

```
doc-approval <domain> [approver-role]
```

- `domain` — the domain folder name, e.g. `onboarding-bolsista`. Resolves the
  artifacts in `docs/domain/<domain>/`.
- `approver-role` — optional; the role that signs (default `Gerência Geral`, whose
  output slug is `gerencia`). For a custom role, derive the slug: lowercase, strip
  accents, spaces → hyphens (`Diretoria Financeira` → `diretoria-financeira`).

The document date is **today's date**. If the domain is missing, ask for it before
proceeding.

## Preconditions

Before generating, the domain folder must contain:

1. `docs/domain/<domain>/domain.md`
2. at least one `docs/domain/<domain>/*.feature`

If either is missing, **stop and tell the user** — do not invent domain content.

## Business-language translation (core rule)

This is an **executive document**. Every line is rewritten into plain business
Portuguese. Strip all technical surface:

- no endpoints, routes, HTTP verbs, status codes;
- no DTO/field names, class names, controllers, use-cases, repositories;
- no Prisma models, tables, columns, SQL, migrations;
- no raw code-style state spelling — translate `UPPER_CASE` states into readable
  Title-Case labels and bold them as business status words;
- internal/technical terms become their business equivalent (e.g. a "wizard"
  becomes an "assistente de cadastro guiado").

Rewrite Gherkin scenarios into one or two readable sentences. Keep the
**Dado / Quando / Então / Regra** connectives as bolded narrative words, but never
transcribe raw step text. See `references/document-structure.md` for the full
section map, the translation rules, and the chip/state colour semantics — read it
before authoring the HTML.

## Workflow

### 1. Resolve and read the source

Read **only** `docs/domain/<domain>/domain.md` and every
`docs/domain/<domain>/*.feature`. Ignore any other file in the folder
(`openapi.yaml`, generated artifacts) — those carry transport/technical detail that
must not leak into a business document. Extract: title, context, the change
(today × proposed) when present, roles, glossary terms, real states, derived
statuses, the rules + scenarios, and scope. Source content by meaning —
`domain.md` headings vary between domains.

### 2. Detect available converters

Prefer a headless Chromium for CSS fidelity. Check availability and fonts:

```bash
command -v google-chrome google-chrome-stable chromium chromium-browser weasyprint libreoffice soffice pandoc pdfinfo
fc-list | grep -iE '\b(Inter|Source Serif|Georgia)\b' | head   # \b avoids matching "Noto Georgian"
```

Source Serif and Inter may not be installed; the template already falls back to
Georgia (titles) and Helvetica/Arial (body), so missing fonts are not blocking.

### 3. Author the styled HTML

Copy `assets/template.html` to `docs/domain/<domain>/aprovacao-<role-slug>.html`
(default `aprovacao-gerencia.html`) and fill each section per
`references/document-structure.md`. The template ships the FAEPEN brand and the A4 /
`print-color-adjust: exact` print rules — keep them unless the user rebrands; never
invent a different org. **Delete** every element the template marks `OPTIONAL` when
it does not apply (scope pill, flow chips, "O que muda", the real-states block for a
domain with no real states of its own), and replace every `{{TOKEN}}`. Author the
source HTML beside the spec so it can be edited and re-generated later.

### 4. Convert to PDF

Use the bundled helper (run it by **absolute path** — the working directory is the
target project, not this skill):

```bash
bash <skill-dir>/scripts/html_to_pdf.sh \
  docs/domain/<domain>/aprovacao-<role-slug>.html \
  docs/domain/<domain>/aprovacao-<role-slug>.pdf
```

It detects the converter (chrome → weasyprint → libreoffice → pandoc), runs it, and
validates with `pdfinfo`. The headless-Chrome `ERROR ... shared_memory` line is
benign and is already filtered out. Equivalent direct command:

```bash
google-chrome --headless=new --disable-gpu --no-sandbox \
  --no-pdf-header-footer --print-to-pdf=<out.pdf> file://<abs-in.html>
```

### 5. Validate and deliver

`pdfinfo` confirms page count/size but cannot see layout. Render the pages to images
and eyeball them before delivering:

```bash
pdftoppm -png -r 90 <out.pdf> /tmp/doc-approval-page   # then read the generated page images
```

Check: no page is mostly empty (move a `.pgbreak` if it breaks badly), no chip or
table is clipped, and **no technical term leaked** (endpoint, DTO, class, raw state,
Prisma). Fix the HTML and re-convert if needed. Then hand back the PDF path and note
the source HTML is kept alongside for edits. Optionally also emit `.docx` when the
user asks (via `pandoc` or `libreoffice --convert-to docx`).

## Output

- `docs/domain/<domain>/aprovacao-<role-slug>.pdf` — the signable document.
- `docs/domain/<domain>/aprovacao-<role-slug>.html` — the editable source.
- optional `docs/domain/<domain>/aprovacao-<role-slug>.docx` — only when requested.

## Resources

- **`references/document-structure.md`** — the 10-section document map (which spec
  source feeds each section), the Gherkin→business translation rules, and the
  FAEPEN visual identity tokens + chip/state colour semantics.
- **`assets/template.html`** — the styled A4 HTML scaffold with embedded FAEPEN CSS
  and one example of each component (cover, lead, compare table, role, glossary,
  state chips, rule/scenario cards, scope, approval block). Copy and fill it.
- **`scripts/html_to_pdf.sh`** — converter detection + HTML→PDF conversion +
  `pdfinfo` validation, with Chrome/WeasyPrint/LibreOffice/Pandoc fallbacks.

## Common mistakes

| Mistake | Fix |
| --- | --- |
| Inventing an org name/tagline for the cover | The template ships the FAEPEN default — keep it. If the user needs different branding, ask; never invent. |
| Forcing a real-states block on a panel/projection domain | If `domain.md` says it has no states of its own, omit that block and render only derived situations (rename §7 to "Situações"). |
| Omitting "O que muda" because there is no literal "Hoje/Passa a ser" block | Include it whenever any contrast can be sourced from the spec; omit only for wholly-new behaviour. |
| Leaving template hint text or `OPTIONAL` elements in the output | Replace every `{{TOKEN}}`; delete each `OPTIONAL` element that does not apply. |
| Dumping fixture dates/values or Scenario Outline rows into scenarios | State the rule relationally; collapse an outline's `Exemplos` table into one scenario card. |
| Mining `openapi.yaml` or cross-domain wiring into the document | Read only `domain.md` + `*.feature`; this is a business doc, not a technical one. |
| Shipping after `pdfinfo` only | Render pages to images; check for blank pages, clipped chips, and leaked technical terms. |

## Rules

- support only Claude Code and Codex;
- one domain per run; stop if `domain.md` or `*.feature` is missing;
- the document is **business-facing** — never leak technical detail (endpoints,
  DTOs, class names, raw states, Prisma);
- reflect only what the spec says; do not invent rules, states, or scope;
- keep real states separate from derived statuses, as in `domain.md`;
- the path `docs/domain/<domain>/` and the FAEPEN identity are this fork's default,
  but keep the generator reusable — override role, branding, and output names from
  the arguments and the spec, not hard-coded project values.
