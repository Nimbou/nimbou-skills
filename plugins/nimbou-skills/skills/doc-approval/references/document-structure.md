# Presentation deck — structure, translation, and identity

Read this in full before authoring `assets/template.html`. It defines (1) the deck
shape and how each section is built, (2) how to derive sections from the spec and how
to translate Gherkin into business language, and (3) the FAEPEN visual identity and
diagram/chip colour semantics.

The goal is a **visual deck** a non-technical sponsor scans in seconds to decide on
approval. Diagrams carry the model; the checklist carries the rules; the description
line gives each section its "why". No paragraphs, no technical surface. Signing
happens outside this artifact — the deck has **no signature block**.

---

## 1. Deck shape

- **Page 1 = cover, alone.** Brand mark + org, kicker "Especificação de Domínio · Para
  aprovação", `<h1>` = domain name in business words, one-line serif subtitle, meta
  line with date + "Aprovação: <role>".
- **Then content pages, each holding AT LEAST 2 sections** (never one section on a
  page — pack them two-up; three only if they genuinely fit without clipping).
- **One section per theme.** The first section is usually **"O que muda"** (the
  hoje×proposto shift) when a contrast can be sourced. The remaining sections group
  the **business rules** by theme — **every business rule in `domain.md` must appear**
  in some section (completeness is required).
- Index each section `NN / TOTAL` in its eyebrow.

Typical deck for a rules-heavy domain: cover · "O que muda" · 3–4 rule-theme sections
= 3 pages (cover + 2 sections + 2 sections). Scale the number of sections to the
number of rule themes; keep two per page.

---

## 2. Section anatomy

Every `.section` has, top to bottom:

1. **`.s-head`** — eyebrow (`THEME` on the left, `NN / TOTAL` on the right).
2. **`.title`** (serif) — a short, plain-business headline for the theme.
3. **`.sdesc`** — **REQUIRED one-to-two-line description** of what the section covers.
   This is not optional: every section carries a description. It also fills vertical
   space so the section does not read as empty.
4. **`.s-body`** — two columns:
   - **left `.mini`** — a small diagram composed from the primitives in §4;
   - **right `.rules`** — a checklist (`✓`) of the theme's rules, one `.rl` per rule.

Keep the checklist to ~4 short lines per section; bold the key noun/verb with `<b>`.

---

## 3. Deriving sections from the spec, and Gherkin → business translation

Read only `domain.md` + the `*.feature` files. Map content by meaning, not by heading.

- **"O que muda"** ← any current-vs-proposed contrast in the spec (even one line of
  prose like "substitui o caminho manual antigo"). Render it as the intro section with
  a vertical hoje ↓ proposto mini and 3–5 checklist gains. Omit only for wholly-new
  behaviour with nothing to contrast.
- **Rule-theme sections** ← the `Regra:` cards across the `*.feature` files and the
  "Regras de negócio" of `domain.md`. Group related rules under one theme (e.g. "a
  quem pertence", "o que cada X enxerga", "governança e limites"). Cover **all** rules.

Rewrite every scenario; never transcribe:

- **`Regra:` / `Cenário:` steps** → one short checklist line stating the rule in
  business words. Keep **Dado / Quando / Então** as bolded connectives only when it
  reads naturally; usually the plain affirmative rule is enough for a checklist.
- **States** — replace every `UPPER_CASE` token with a readable Title-Case label and
  bold it (`PENDENTE` → **Pendente**). Do not render a dedicated states section; fold
  a relevant state into the rule line or a diagram tag when it matters.
- **Scenario Outlines** (`Esquema do Cenário` + `Exemplos:`) → collapse into ONE line
  stating the variation ("vale para os três tipos"). Never dump the rows.
- **Drop fixture dates/values** — express relationally ("acima do teto", "antes do
  início"), never the literal `R$ 1.000,00` / `15/12/2025`.
- **Strip ALL technical surface** — no endpoints, verbs, status codes, DTO/field
  names, class/controller/use-case/repository names, Prisma models, tables, columns,
  SQL, migrations, tokens. Translate internal terms to their business equivalent
  (a "wizard" → "assistente de cadastro guiado"; an acronym spelled out once).

---

## 4. Mini-diagram vocabulary

Compose each section's `.mini` from these primitives — the diagram is authored per
theme, it is **not** a fixed template. Pick the shape that shows the theme's idea:

- **`.tag`** — a labelled node. Colour by meaning:
  - `.tag.owner` (green) → owner / positive / "proposto";
  - `.tag.bad` (red) → the bad status quo / "hoje";
  - `.tag.gold` → the highlighted / project-specific / own variant;
  - plain `.tag` → a neutral target.
  Optional `.tag .k` eyebrow inside a tag for a small kicker label.
- **`.node`** — a larger boxed node (same colour modifiers) for a headline pair.
- **Arrows** — `.ar` (`→`) for "leads to / has"; `.ar.dn` (`↓`) for a vertical step.
- **`.barrier`** (`✕`, red) — isolation or mutual exclusion between two things.
- **`.chip` / `.chips`** — a compact list of short items under a node.
- **`.vp`** — a **vertical pair** (label ↓ target) stacked in a narrow column.
- **`.note`** — a one-line muted caption under the mini restating the takeaway.

Common shapes: `hoje ↓ proposto` (the shift); `owner → its items` rows (ownership);
two `.vp` separated by `✕` (isolation); `actor → action` rows (governance).

**Anti-wrap rule (important).** The left column is ~70 mm. A horizontal
`rótulo → alvo comprido` will wrap and leave the arrow pointing at nothing. When the
target label is long, either use a **`.vp`** (vertical pair) or **shorten the label**
to one or two words. Verify in the rendered PDF that no arrow dangles.

---

## 5. Visual identity (FAEPEN)

These tokens are wired into `assets/template.html` `:root`. Keep them unless the user
asks to rebrand; never invent a different org.

| Token | Value | Role |
| --- | --- | --- |
| `--green` | `#2C5937` | institutional green — titles, owner tags |
| `--green-deep` | `#132819` | dark green — strong labels |
| `--gold` | `#C4922A` | gold — eyebrow underline, arrows, check markers |
| `--danger` | `#B71C1C` | red — "hoje"/bad tags, the `✕` barrier |
| `--neutral` | `#F8F6F3` | off-white — chips background |
| `--ink` | `#2D2A26` | body text |

- **Titles** in serif (`Georgia` fallback — Source Serif may be absent). **Body** in
  sans (`Inter` fallback — Helvetica/Arial print fine).
- **Page**: A4 portrait, margins `15mm`, `print-color-adjust: exact` so tags, chips,
  the gold eyebrow and the `✕` survive printing.
- The converter (`scripts/html_to_pdf.sh`) honours whatever `@page size` the HTML
  declares — A4 portrait is the default; do not change it without reason.
