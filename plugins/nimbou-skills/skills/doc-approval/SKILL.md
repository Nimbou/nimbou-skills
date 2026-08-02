---
name: doc-approval
description: Use this skill to generate a non-technical visual presentation deck (PDF) for management or stakeholders from a domain spec (`docs/domain/<domain>/domain.md` + `*.feature`). Trigger when the user asks to "gerar PDF de aprovação", "apresentação de domínio", "documento de aprovação da gerência", "aprovação do stakeholder", or "doc-approval <domain>". Renders a cover + themed sections (mini-diagram + rules checklist + description, two per page) in plain business Portuguese — no endpoints, DTOs, class names, code-level states, or Prisma details.
---

# Doc Approval

Generate an **executive presentation deck** (PDF) from a domain specification so a
non-technical decision-maker (e.g. Gerência Geral) can scan it in seconds and decide
on approval before development starts. The deck is visual: a cover, then themed
sections — each a **mini-diagram + a rules checklist + a one-line description** —
packed **at least two per page**.

The input is the engineering spec under `docs/domain/<domain>/` (`domain.md` plus its
`*.feature` files). The output is a styled, print-ready PDF written in plain business
language, plus the source HTML kept beside it for re-editing.

This deck is an aid for the approval **decision**; it carries **no signature block**.
The sign-off itself happens outside the artifact.

## When to use

Use when an approved or near-approved domain spec needs a business sponsor to review
the rules visually before work begins. The reader is a manager or stakeholder, **not**
an engineer: the deck must carry the business rules and decisions, never the
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
- `approver-role` — optional; the role that approves (default `Gerência Geral`, whose
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

This is an **executive deck**. Every line is rewritten into plain business
Portuguese. Strip all technical surface:

- no endpoints, routes, HTTP verbs, status codes;
- no DTO/field names, class names, controllers, use-cases, repositories;
- no Prisma models, tables, columns, SQL, migrations;
- no raw code-style state spelling — translate `UPPER_CASE` states into readable
  Title-Case labels and bold them as business status words;
- internal/technical terms become their business equivalent (e.g. a "wizard"
  becomes an "assistente de cadastro guiado").

Turn Gherkin `Regra:`/`Cenário:` into **short checklist lines**, one per rule, in
business words — never transcribe raw step text. **Every business rule in `domain.md`
must appear** in some section. See `references/document-structure.md` for the deck
shape, section anatomy, the diagram vocabulary, and the identity/colour semantics —
read it before authoring the HTML.

## Workflow

### 1. Resolve and read the source

Read **only** `docs/domain/<domain>/domain.md` and every
`docs/domain/<domain>/*.feature`. Ignore any other file in the folder
(`openapi.yaml`, generated artifacts) — those carry transport/technical detail that
must not leak into a business deck. Extract: title, context, the change
(today × proposed) when present, and every business rule (grouped into themes).
Source content by meaning — `domain.md` headings vary between domains.

### 2. Detect available converters

Prefer a headless Chromium for CSS fidelity. Check availability and fonts:

```bash
command -v google-chrome google-chrome-stable chromium chromium-browser weasyprint libreoffice soffice pandoc pdfinfo
fc-list | grep -iE '\b(Inter|Source Serif|Georgia)\b' | head   # \b avoids matching "Noto Georgian"
```

Source Serif and Inter may not be installed; the template already falls back to
Georgia (titles) and Helvetica/Arial (body), so missing fonts are not blocking.

### 3. Author the deck HTML

Copy `assets/template.html` to `docs/domain/<domain>/apresentacao-<role-slug>.html`
(default `apresentacao-gerencia.html`) and fill it per
`references/document-structure.md`:

- **Cover** on page 1 (alone): title, one-line subtitle, date + approver role. Keep
  the FAEPEN brand; never invent a different org.
- **One section per theme**, starting with **"O que muda"** when a hoje×proposto
  contrast exists, then one section per rule-theme so that **all business rules
  appear**. Pack **at least two sections per page** — never leave one section alone.
- Each section: eyebrow (`THEME · NN / TOTAL`), serif title, a **required one-line
  `.sdesc` description**, then a left **mini-diagram** composed from the primitives
  (`.tag`/`.node`/arrows/`.barrier`/`.chip`/`.vp`) and a right **rules checklist**.
- Compose each mini-diagram to fit the theme; obey the **anti-wrap rule** (use `.vp`
  or short labels in the narrow left column so no arrow dangles).

Author the HTML **directly** (Write/Edit). **Never** post-process it with `perl -i` or
`sed` that re-encodes the file — it corrupts UTF-8 accents (mojibake).

### 4. Convert to PDF

Use the bundled helper (run it by **absolute path** — the working directory is the
target project, not this skill):

```bash
bash <skill-dir>/scripts/html_to_pdf.sh \
  docs/domain/<domain>/apresentacao-<role-slug>.html \
  docs/domain/<domain>/apresentacao-<role-slug>.pdf
```

It detects the converter (chrome → weasyprint → libreoffice → pandoc), runs it,
honours the `@page` size the HTML declares (A4 portrait by default), and validates
with `pdfinfo`. The headless-Chrome `ERROR ... shared_memory` line is benign and is
already filtered out.

### 5. Validate and deliver

`pdfinfo` confirms page count/size but cannot see layout. Render the pages to images
and eyeball them before delivering:

```bash
pdftoppm -png -r 90 <out.pdf> /tmp/doc-approval-page   # then read the generated page images
```

Check: the cover is alone on page 1; **every content page has ≥ 2 sections** (no
orphan section, no orphan footer page); **every section has a description**; the
**mini-diagrams do not wrap** (no arrow pointing at nothing); no chip or tag is
clipped; **all business rules are present**; no accents are mojibake; and **no
technical term leaked** (endpoint, DTO, class, raw state, Prisma). Fix the HTML and
re-convert if needed. Then hand back the PDF path and note the source HTML is kept
alongside for edits.

## Output

- `docs/domain/<domain>/apresentacao-<role-slug>.pdf` — the presentation deck.
- `docs/domain/<domain>/apresentacao-<role-slug>.html` — the editable source.

## Resources

- **`references/document-structure.md`** — the deck shape, section anatomy, how to
  derive themed sections from the spec, the Gherkin→business translation rules, the
  mini-diagram vocabulary, and the FAEPEN identity + colour semantics.
- **`assets/template.html`** — the styled A4-portrait deck scaffold with embedded
  FAEPEN CSS: cover + example content page of two sections, plus one example of each
  diagram primitive (tag/node/arrow/barrier/chip/vertical-pair) and the rules
  checklist. Copy and fill it.
- **`scripts/html_to_pdf.sh`** — converter detection + HTML→PDF conversion +
  `pdfinfo` validation, with Chrome/WeasyPrint/LibreOffice/Pandoc fallbacks. It is
  page-size agnostic (honours the HTML's `@page`).

## Common mistakes

| Mistake | Fix |
| --- | --- |
| Inventing an org name/tagline for the cover | The template ships the FAEPEN default — keep it. If the user needs different branding, ask; never invent. |
| A section with no description | Every `.section` carries a required `.sdesc` line — write one that says what the section covers. |
| Leaving one section alone on a page (orphan / mostly-empty page) | Pack at least two sections per content page; move a section so no page ends up empty. |
| A mini-diagram arrow pointing at nothing (label wrapped) | Use a `.vp` vertical pair or shorten the target label in the ~70 mm left column. |
| Dropping business rules to keep it short | All rules from `domain.md` must appear; group them into themes, never omit. |
| Post-processing the HTML with `perl -i`/`sed` | It re-encodes and mojibakes accents. Author the HTML directly with Write/Edit. |
| Dumping fixture dates/values or Scenario Outline rows | State the rule relationally; collapse an outline into one checklist line. |
| Mining `openapi.yaml` or cross-domain wiring into the deck | Read only `domain.md` + `*.feature`; this is a business deck, not a technical one. |
| Shipping after `pdfinfo` only | Render pages to images; check orphans, wraps, clipped tags, mojibake, and leaked technical terms. |

## Rules

- support only Claude Code and Codex;
- one domain per run; stop if `domain.md` or `*.feature` is missing;
- the deck is **business-facing** — never leak technical detail (endpoints, DTOs,
  class names, raw states, Prisma);
- reflect only what the spec says; do not invent rules or scope;
- **every business rule must appear**; group rules into themed sections;
- **no signature block** — the deck supports the approval decision, it is not the
  signing instrument;
- the path `docs/domain/<domain>/` and the FAEPEN identity are this fork's default,
  but keep the generator reusable — override role, branding, and output names from
  the arguments and the spec, not hard-coded project values.
