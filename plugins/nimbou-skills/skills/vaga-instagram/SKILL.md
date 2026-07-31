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

- Templates in `assets/`: `story.html`, `feed.html` and — only for vacancies
  spread over several units/locations — `units-story.html` / `units-feed.html`.
  Fill the placeholders only; **do not** edit colors, fonts, layout or footer.
- Logo: `assets/faepen-logo.png` (official). No other logo goes on the art.
- Palette: green `#1f6933` / `#173525`, off-white `#f7fbf8`. Fonts: Montserrat +
  Raleway (loaded from Google Fonts by the template).
- **No CTA button and no "Programa de Estágio" chip** — both were removed on
  purpose. The footer is `faepen.org.br/vagas` + `@faepenmt`, and the empty band
  above it in the story is where the **link sticker** goes at publish time. Do
  not reintroduce either; do not print the vacancy URL on the art.
- Header order (all pieces): título → função → concedente (white bold) → cidade
  with the pin icon. **Modalidade is not printed on the art** — it lives in the
  caption.

## Workflow

### 1. Extract fields from the raw text

Fill this table from the vacancy text. Normalize informal wording (e.g.
"contabilidade" → "Ciências Contábeis", "VT" → "vale-transporte").

| Placeholder | Content | Limit |
|---|---|---|
| `{{TITULO}}` | `Vagas de Estágio Remunerado` when a bolsa value is published; `Vagas de Estágio` otherwise. Singular when there is one opening | **max 2 lines** |
| `{{FUNCAO}}` | Role or area (e.g. `Auxiliar de Sala`, `Setor Financeiro`) | ≤ 22 chars |
| `{{EMPRESA}}` | Concedente name (e.g. `Secretaria Municipal de Educação`) | ≤ 32 chars |
| `{{CIDADE}}` | City only, no UF (e.g. `Sinop`) | ≤ 18 chars |
| `{{CURSOS}}` | Accepted courses (e.g. `Administração ou Ciências Contábeis`) | ≤ 70 chars |
| `{{BOLSA}}` | Value + benefits (e.g. `R$ 1.000,00 + vale-transporte`) | ≤ 70 chars |
| `{{HORARIO}}` | Days + hours (e.g. `Seg. a sex. · 07h às 11h`) | ≤ 44 chars |
| `{{NOTA}}` | Optional 2nd line under Horário. Only when there is a units piece (e.g. `11 unidades — veja a lista no próximo story`). Otherwise delete the whole `<span class="nota">` | ≤ 50 chars |
| link | Vacancy URL on faepen.org.br (caption + story sticker) | — |

`{{TITULO}}` sizing: at 80px the story fits `Vagas de Estágio Remunerado` in two
lines; a shorter title may go up to 104px. **Three lines is a defect** — drop the
font-size until it fits in two.

### 2. Confirm what is missing — never invent

If any field is missing or ambiguous, ask via `AskUserQuestion` before
generating. Also confirm when:

- the bolsa value is absent (offer: ask concedente / publish "bolsa + benefícios
  compatíveis" only with explicit user approval);
- a field exceeds its limit — propose the abbreviation and get approval;
- the vacancy covers **several units/locations** — see step 3b.

Do not ask about fields already clear in the text. Do not ask for the link: it is
usually pasted at publish time; leave `[INSERIR LINK DA VAGA NA PUBLICAÇÃO]` in
the caption unless the user provides it.

### 3. Fill the templates

Work in the output folder `docs/vagas/<slug>/` (slug: lowercase, no accents,
hyphens — e.g. `estagio-auxiliar-sala-sinop`), unless the user names another.

1. Copy `assets/story.html`, `assets/feed.html` and `assets/faepen-logo.png`
   into the output folder (the HTML references the logo by relative name).
2. Replace the `{{...}}` placeholders in the copies with the Edit tool (safer
   than sed — values contain `R$`, `/`, `&`).

### 3b. Vacancy with several units/locations

A list of schools/branches does **not** fit the 3-item card. When the vacancy
names more than ~3 units, add a second piece:

1. Copy `assets/units-story.html` → `story2.html` and `assets/units-feed.html`
   → `feed2.html`.
2. `{{TITULO_LISTA}}` = `Unidades e Horários`; `{{SUBTITULO}}` = the shared part
   (e.g. `Segunda a sexta-feira`); `{{CONTEXTO}}` (story only) = função · cidade,
   so whoever lands straight on this piece knows which vacancy it is.
3. Repeat the `.unit` row per unit — name on the left, hours on the right. Units
   that differ from the majority (a second shift, another day range) carry the
   full text in their own row; do not footnote them.
4. In `story.html`, keep `{{HORARIO}}` as the majority schedule and use
   `{{NOTA}}` to point to the next story. In `feed.html`, `{{HORARIO}}` ends with
   `(ver unidades)`.
5. Publishing: **2 stories in sequence** + **2-slide carousel** in the feed.

Above ~11 rows the card overflows: shrink `.nome`/`.hora` or split into two
pieces — never let rows fall off the canvas.

### 4. Render

```bash
scripts/html_to_png.sh <dir>/story.html <dir>/story.png 1080 1920
scripts/html_to_png.sh <dir>/feed.html  <dir>/feed.png  1080 1350
```

The script finds Chrome on Linux/macOS **and** on Windows (`chrome.exe` is not on
PATH there; it also converts MSYS paths with `cygpath`, or Chrome writes a file
with a literal `/c/...` name). With python3 + Pillow it renders taller and crops;
without them it renders at the exact `--window-size`, which is fine on Chrome
120+ with `--headless=new` — the visual check below is the safety net.

### 5. Verify visually — mandatory

Read **every** PNG and check: (a) footer intact — `@faepenmt` visible on the
stories, the `faepen.org.br/vagas · @faepenmt` line on the feed; (b) the title in
**at most 2 lines**; (c) no card field wrapping past 2 lines, and no orphan word
alone on a line; (d) values match the confirmed fields. If anything is off, fix
the field text (abbreviate) or the font-size and re-render. Never deliver
unchecked images.

### 6. Caption (`legenda.txt`)

Write in the same folder, following this shape:

```
📢 {TITULO} | {FUNCAO} 💼

A Fundação FAEPEN está com vagas de estágio remunerado abertas na {EMPRESA}, em {Cidade}.

🎓 Cursos: {CURSOS}
💰 Bolsa: {BOLSA}
🕐 Horário: {HORARIO}
📍 {Cidade}

🏫 Unidades ({período}):        ← só quando houver peça de unidades
• {Unidade} — {horário}
...

👉 Inscreva-se: {LINK ou [INSERIR LINK DA VAGA NA PUBLICAÇÃO]}
O link também está no sticker do story.
A lista completa das unidades está no 2º story e no 2º slide do post.

Compartilhe com quem está procurando estágio!

#estagio #vagadeestagio #estagiario #faepen #{cidade} #estagio{cidade} + 2-4 hashtags do curso/área
```

Hashtags: lowercase and **without accents** (better reach on Instagram search).
Modalidade (Presencial/Híbrido) goes here, never on the art — and only when the
text states it.

### 7. Deliver

Send every PNG plus `legenda.txt`, and remind the user: ao publicar o story,
adicionar o **sticker de link** no espaço livre acima do rodapé.

## Common mistakes

| Mistake | Consequence |
|---|---|
| Redesigning the layout "to fit better" | Breaks brand consistency — abbreviate the field or drop the font-size instead |
| Rebuilding the art from scratch instead of the templates | Different visual every week; wasted tokens |
| Reintroducing the CTA button or the "Programa de Estágio" chip | Both were removed on purpose; the button covers the sticker area |
| Cramming a list of units into the 3-item card | The list becomes the smallest text on the piece — use `units-*.html` |
| Inventing bolsa/horário/modalidade not present in the text | Wrong public information under FAEPEN's name |
| Printing modalidade or the vacancy URL on the art | Modalidade lives in the caption; the link lives in the sticker |
| Letting the title wrap to 3 lines | Squeezes the card and the footer |
| Skipping the visual check of any PNG | Clipped or overflowing text reaches Instagram |
| Embedding the concedente's logo | Third-party brand misuse; only the name appears |
