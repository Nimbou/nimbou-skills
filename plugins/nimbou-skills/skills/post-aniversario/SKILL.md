---
name: post-aniversario
description: Use this skill when the user wants a Fundação FAEPEN employee birthday post for Instagram — "post de aniversário", "arte de aniversariante", "aniversário do colaborador", "post-aniversario <nome>". Input is the person's name, setor and date plus a photo file on disk; output is a single 1080x1080 feed art. Do not use for other companies' branding, for vacancy posts (use vaga-instagram) or for stories.
---

# Post de Aniversário (FAEPEN)

Generate the **final Instagram feed art** (1080×1080) celebrating a Fundação
FAEPEN employee's birthday. The visual identity is a **fixed FAEPEN template** —
never redesign it per person.

Output is **one PNG only**. No story, no caption — those are out of scope by
decision. If the user wants a vacancy post instead, use `vaga-instagram`.

## Fixed brand rules (never change)

- Template: `assets/feed.html`. Fill the placeholders only; **do not** edit
  colors, layout, background or logo position.
- Background: `assets/fundo-aniversario.png` (dourado com glitter e seda).
  Square source, square canvas — it fits without cropping.
- Logo: `assets/faepen-logo.png` (official, transparent), bottom-right, on the
  same axis as the date. No other logo.
- Palette: oliva `#48381e` (título + setor), branco `#ffffff` (nome + data) —
  sampled from the reference art; do not swap for the FAEPEN greens. Fonts
  loaded from Google Fonts by the template: Montserrat 900 (título + data),
  Great Vibes (nome), Playfair Display italic (setor) — same CDN convention as
  `vaga-instagram`.
- One art **per person**. Several birthdays on the same day = several arts,
  published as a carousel. Never combine two people in one piece.

## Workflow

### 1. Collect the fields — ask once, never invent

| Placeholder | Content | Rule |
|---|---|---|
| `{{NOME}}` | Full name as it should appear (e.g. `Patrícia Alencar`) | **must fit one line** — see sizing below |
| `{{SETOR}}` | Setor or cargo (e.g. `Setor Administrativo`, `Estágio`) | **required**; ≤ 34 chars |
| `{{DATA}}` | Birthday as `DD/MM` (e.g. `08/05`) | zero-padded, no year |
| foto | **Path to an image file on disk** | see step 2 |

Whatever is missing from the invocation, ask for **all of it in a single**
`AskUserQuestion` call. Do not ask about fields already given.

### 2. The photo must be a file on disk

A photo pasted into the conversation is **not** usable: the template renders in
headless Chrome, which reads `foto.png` from the output folder. There is no tool
that writes a chat attachment to disk. If the user only attached an image, ask
them to save it and give the path (e.g. `C:\Users\...\Downloads\fulano.png`).

Any aspect ratio works — the template crops a centered square via
`object-fit: cover` with `object-position: center 22%`, which favours the face.
If the person is markedly off-centre in the frame, adjust `object-position` on
that copy only (not on the template in `assets/`).

### 3. Fill the template

Work in `docs/aniversarios/<slug>/` (slug: lowercase, no accents, hyphens —
e.g. `patricia-alencar`), unless the user names another folder.

1. Copy `assets/feed.html`, `assets/fundo-aniversario.png` and
   `assets/faepen-logo.png` into the output folder (the HTML references both by
   relative name).
2. Copy the person's photo into the folder **as `foto.png`**.
3. Replace `{{NOME}}`, `{{SETOR}}` and `{{DATA}}` in the copy with the Edit tool.

**`{{NOME}}` sizing.** `.nome` starts at `118px` and must fit **one line**. Two
lines is a defect — step down the `font-size` until it fits: `118 → 104 → 92 →
80 → 68`. At 118px roughly 17 characters fit; Great Vibes is wide, so long names
need the step-down. If it still does not fit at 68px, propose shortening to first
+ last surname (`Maria Aparecida Gonçalves` → `Maria Gonçalves`) and **get the
user's approval** before rendering — never truncate a person's name silently.

### 4. Render

```bash
scripts/html_to_png.sh <dir>/feed.html <dir>/feed.png 1080 1080
```

The script finds Chrome on Linux/macOS **and** on Windows. Fonts come from the
CDN, so the render needs network — a fallback font is a silent failure mode, and
the visual check below is what catches it.

### 5. Verify visually — mandatory

Read the PNG and check:

- (a) the script font actually rendered on `{{NOME}}` (cursive, not a plain
  sans — a sans means the CDN did not load; re-render);
- (b) `{{NOME}}` on **one line**, not clipped at either edge;
- (c) the face is fully inside the polaroid, not cropped at the forehead or chin;
- (d) título, data and logo all fully inside the canvas;
- (e) nome, setor and data match what the user confirmed.

Never deliver an unchecked image.

### 6. Deliver

Send `feed.png`. Say the folder it lives in. Nothing else is produced.

## Common mistakes

| Mistake | Consequence |
|---|---|
| Redesigning the layout or swapping the background "to vary" | Breaks the recognisable birthday format — the template is fixed on purpose |
| Trying to use a photo attached in the chat instead of a file path | The render produces a broken-image box; ask for the path |
| Letting `{{NOME}}` wrap to two lines | Collides with the setor line and unbalances the piece |
| Truncating a long name without asking | Publishes a person's name wrong under FAEPEN's brand |
| Inventing the setor or the date | Wrong public information about a real employee |
| Combining two birthdays in one art | Not supported by the template; one art per person |
| Producing a story or a caption | Out of scope — this skill delivers one feed PNG |
| Skipping the visual check | A fallback font or a cropped face reaches Instagram |
