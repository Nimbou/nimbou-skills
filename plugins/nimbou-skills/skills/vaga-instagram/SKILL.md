---
name: vaga-instagram
description: Use this skill when the user wants to divulgar uma vaga de estágio da Fundação FAEPEN no Instagram — "post de vaga", "story de vaga", "arte da vaga", "divulgar vaga", "vaga-instagram <texto da vaga>". Input is the raw vacancy text (e-mail/WhatsApp); output is the final story and feed art plus caption. Do not use for other companies' branding or for non-vacancy Instagram content.
---

# Vaga Instagram (FAEPEN)

Generate the **final Instagram assets** for a Fundação FAEPEN internship vacancy:
story art (1080×1920), feed art (1080×1350) and a ready-to-paste caption. The
visual identity is a **fixed FAEPEN template** — never redesign it per vacancy.

The input is the vacancy text as it arrived (e-mail, WhatsApp, free text). The
concedente (host company) appears **by name only** — never fetch or embed a
third-party logo.

## Fixed brand rules (never change)

- Templates: `assets/story.html` and `assets/feed.html` in this skill. Fill the
  placeholders only; **do not** edit colors, fonts, spacing, layout, or CTA text.
- Logo: `assets/faepen-logo.png` (official). No other logo goes on the art.
- Palette: green `#1f6933` / `#173525`, off-white `#f7fbf8`. Fonts: Montserrat +
  Raleway (loaded from Google Fonts by the template).
- CTA is fixed: button "Inscreva-se pelo site" + `faepen.org.br/vagas · link na
  bio` + `@faepenmt`. The per-vacancy link goes in the caption and in the story
  **link sticker** at publish time — not printed on the art.

## Workflow

### 1. Extract fields from the raw text

Fill this table from the vacancy text. Normalize informal wording (e.g.
"contabilidade" → "Ciências Contábeis", "VT" → "vale-transporte"). When no
setor/área is named, derive the hook from the course area (cursos de saúde →
`Área da Saúde`) — this is presentation, not invented data.

| Placeholder | Content | Limit |
|---|---|---|
| `{{SETOR}}` | Area/hook of the vacancy (e.g. `Setor Financeiro`) | ≤ 22 chars |
| `{{EMPRESA}}` | Concedente name (e.g. `Supermercado Bom Preço`) | ≤ 32 chars |
| `{{LOCAL}}` | `Cidade – UF · Modalidade` (e.g. `Sinop – MT · Presencial`) | ≤ 32 chars |
| `{{CURSOS}}` | Accepted courses (e.g. `Administração ou Ciências Contábeis`) | ≤ 70 chars |
| `{{BOLSA}}` | Value + benefits (e.g. `R$ 800,00 + vale-transporte`) | ≤ 70 chars |
| `{{HORARIO}}` | Hours/turn (e.g. `6h por dia · segunda a sexta · matutino`) | ≤ 70 chars |
| link | Vacancy URL on faepen.org.br (caption + story sticker) | — |

### 2. Confirm what is missing — never invent

If any field (including the vacancy link) is missing or ambiguous, ask via
`AskUserQuestion` before generating. Also confirm when:

- the bolsa value is absent (offer: ask concedente / publish "bolsa + benefícios
  compatíveis" only with explicit user approval);
- modalidade is not stated (do **not** default to Presencial silently);
- a field exceeds its limit — propose the abbreviation and get approval.

Do not ask about fields already clear in the text.

### 3. Fill the templates

Work in the output folder `docs/vagas/<slug>/` (slug: lowercase, no accents,
hyphens — e.g. `estagio-financeiro-bom-preco`), unless the user names another.

1. Copy `assets/story.html`, `assets/feed.html` and `assets/faepen-logo.png`
   into the output folder (the HTML references the logo by relative name).
2. Replace the `{{...}}` placeholders in the copies with the Edit tool (safer
   than sed — values contain `R$`, `/`, `&`).

### 4. Render

```bash
scripts/html_to_png.sh <dir>/story.html <dir>/story.png 1080 1920
scripts/html_to_png.sh <dir>/feed.html  <dir>/feed.png  1080 1350
```

The script renders with headless Chrome at extra height and crops to the exact
size (exact `--window-size` shrinks the viewport and clips the footer — do not
"simplify" the script back to an exact-size screenshot).

### 5. Verify visually — mandatory

Read both PNGs and check: (a) footer intact — `@faepenmt` visible on the story,
`faepen.org.br/vagas` line visible on the feed; (b) no field wraps beyond 2
lines in the card; (c) values match the confirmed fields. If anything is off,
fix the field text (abbreviate) and re-render. Never deliver unchecked images.

### 6. Caption (`legenda.txt`)

Write in the same folder, following this shape:

```
📢 Vaga de Estágio | {SETOR} 💼

A Fundação FAEPEN está com vaga de estágio aberta na {EMPRESA}, em {Cidade – UF}.

🎓 Cursos: {CURSOS}
💰 Bolsa: {BOLSA}
🕐 Horário: {HORARIO}
📍 {Modalidade} — {Cidade – UF}

👉 Inscreva-se: {LINK}
O link também está na bio e no sticker do story.

Compartilhe com quem está procurando estágio!

#estagio #vagadeestagio #estagiario #faepen #{cidade} #estagio{cidade} + 2-4 hashtags do curso/área
```

Hashtags: lowercase and **without accents** (better reach on Instagram search).

### 7. Deliver

Send `story.png`, `feed.png` and `legenda.txt` to the user and remind them: ao
publicar o story, adicionar o **sticker de link** apontando para a URL da vaga.

## Common mistakes

| Mistake | Consequence |
|---|---|
| Redesigning the layout "to fit better" | Breaks brand consistency — abbreviate the field instead |
| Rebuilding the art from scratch instead of the templates | Different visual every week; wasted tokens |
| Inventing bolsa/horário/modalidade not present in the text | Wrong public information under FAEPEN's name |
| Printing the vacancy URL on the art | CTA is fixed; per-vacancy link lives in caption + story sticker |
| Exact-size screenshot without the crop step | Footer clipped (`@faepenmt` disappears) |
| Skipping the visual check of the PNGs | Clipped or overflowing text reaches Instagram |
| Embedding the concedente's logo | Third-party brand misuse; only the name appears |
