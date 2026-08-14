---
name: theming-nimbou-site
description: Use when applying a client's visual identity to a freshly-scaffolded nimbou site (Laravel shell + Nuxt 4/Vuetify 3) — turning the neutral skeleton into the redesign's look from a MACHINE-READABLE design source (redesign HTML/CSS export, a live URL, a logo SVG). Runs after scaffold-nimbou-site. NOT for Figma/image/PDF sources (need visual extraction), and NOT the CMS content step (uploading logo/icons into the informations module → that's laravel-plan).
---

# theming-nimbou-site

## Overview

Turn the neutral green skeleton that `scaffold-nimbou-site` leaves into the client's identity: **extract palette + type by evidence, apply them through the known nimbou files, then VERIFY by measuring the rendered DOM.** Self-host everything; the browser — not a grep — is the source of truth.

This is a **technique** skill (a procedure), not think+plan. Input must be **machine-readable** (HTML/CSS/SVG export, or a live URL you can scrape). Figma/image/PDF/verbal briefs are out of scope — they need visual extraction the grep method can't do.

## When to use

- Right after `scaffold-nimbou-site`, to theme the skeleton from a redesign export / live URL / brand assets.
- **Not** for: image-only or Figma sources; the Nuxt page/section build (`nuxt-think`/`nuxt-plan`); uploading brand assets into the `informations` CMS module (that's the content step — see the boundary below).

## The nimbou theming surface (the only files you touch)

| File | What it holds |
|---|---|
| `resources/nuxt/plugins/vuetify.ts` | The theme palette — Vuetify **semantic tokens** (`primary`/`secondary`/`accent`/`background`/`surface`/`surface-variant`/`on-*`) + custom tokens + `variations`. |
| `resources/nuxt/assets/style/vuetifyTheme.scss` | `$body-font-family`, the `@font-face` blocks, and the `.font-display`/`.font-body` helper classes. |
| `resources/nuxt/assets/font/<Family>/` | The **self-hosted** variable TTFs. |
| `resources/nuxt/nuxt.config.ts` | `app.head.title`. |
| `resources/nuxt/public/` + `assets/img/` | Logo + derived favicon/PWA/share files. |

## Process

### 1. Extract by evidence (not by eye)
- **Palette by frequency:** `grep -oiE '#[0-9a-f]{6}' source.html | tr 'A-F' 'a-f' | sort | uniq -c | sort -rn`. The most-used hexes are the real hierarchy. **Filter noise** — embedded widgets (Google-reviews `#4285F4/#EA4335/#FBBC05/#34A853`, maps, YouTube) are not brand colors. Also grab `rgb()`.
- **Confirm brand colors from the logo SVG** (`fill:rgb(...)`) — the logo's fills are the ground truth for primary/accent.
- **Type by grep:** `grep -oiE "font-family:[^;\"}]+"` + any `fonts.googleapis.com/...family=` link. The **brand face is the one actually loaded/used** on headings/nav/buttons — not the page-builder's `Helvetica/Arial` body *fallback*.

### 2. Map to Vuetify semantic tokens
Set the roles in `plugins/vuetify.ts`: `primary` (dominant brand), `accent` (CTA), `secondary`, `background` (page), `surface` (cards), `surface-variant` (borders), `on-*` (text/contrast), plus custom tokens (e.g. `whatsapp`). Style **through tokens** — never hardcode a brand hex in a component. Leave fixed brand colors alone (e.g. WhatsApp `#25D366`).

### 3. Self-host the fonts — NEVER link a CDN
The nimbou convention is **self-hosted** fonts (CSP, offline, performance, no layout-shift on a third party). Do NOT add a `fonts.googleapis.com` `<link>`.
- Download from the **Google Fonts OFL repo** (`github.com/google/fonts/raw/main/ofl/<family>/`): the **variable TTF** (`<Family>%5B<axes>%5D.ttf`, roman + italic) **if the family has one** — else the family is **static-only** (many are — e.g. Poppins, Montserrat) and you download the **static weights the design actually uses** (`<Family>-Regular.ttf`, `-Medium.ttf`, `-SemiBold.ttf`, `-Bold.ttf`, + italics). One `@font-face` per weight for static; one spanning `font-weight: 100 900` for variable.
- Add `@font-face` in `vuetifyTheme.scss` (`font-weight: 100 900; font-display: swap;`), point `$body-font-family` + the `.font-display`/`.font-body` helpers, and **remove the starter's default fonts** (files + `@font-face`).
- If the face **isn't on Google Fonts**, ask the user for the font file — **never** fall back to a CDN link.

### 4. Branding files — derive, don't upload
- Put the logo in the project (`assets/img/` and/or `public/`).
- **Derive the raster branding from the SVG**: favicon (16/32), apple-touch (180), PWA icons (192/512), share/OG image (1200×630). Use a raster tool available in the project — `sharp` via a one-off node script (it's a Nuxt project, Node is present), or `rsvg-convert`/ImageMagick. If no tool is available, say so and hand the SVG to the content step.
- Set `app.head.title` in `nuxt.config.ts`.
- **Boundary:** do NOT upload logo/icons into the `informations` CMS module — that's the content step (`laravel-plan`/Fase 2). Prepare the files and **hand off the asset list**. (The runtime header/footer logo is CMS-driven from `informations.img.featured` — theming makes the assets ready; the CMS wiring is not this skill.)

### 5. VERIFY by measuring the DOM (grep is necessary, not sufficient)
Grepping that old hexes are gone proves the *source* changed — not that tokens/fonts actually **resolve**. Bring the site up and measure:
- Install deps if needed and run the dev server (`pnpm dev`; use a free port if the site port is taken). **If the dev server won't boot** (pnpm/Vite toolchain issues happen), do a **production build instead** — `nuxi generate`, then serve `.output/public` — the app is `ssr:false`, so the rendered DOM is identical and the successful build also proves the SCSS/Vuetify compile cleanly.
- In the browser, read computed values: each `getComputedStyle(document.documentElement).getPropertyValue('--v-theme-primary')` (etc.) equals the intended hex; a `.font-display` element's computed `font-family` is the brand face; `document.fonts.check('16px <Family>')` is `true`; **zero console errors**.

### 6. Deliver a styleguide artifact
Generate a self-contained styleguide (palette swatches with hex+role, the type scale in the real faces, sample components — buttons, a card, the CTA) with the **fonts embedded as data URIs**, and publish it for client review. It is the reviewable deliverable of the phase.

## Common mistakes (seen in baselines without this skill)

| Mistake | Do instead |
|---|---|
| **Linking the Google Fonts CDN** ("no TTF available / downloading wasn't in scope") | Self-host: download the variable TTF from the OFL repo (§3). No CDN link, ever. If not on Google Fonts, request the file. |
| **Verifying by grepping for old hexes** | Grep is necessary but not sufficient — bring it up and **measure the DOM** (§5): tokens resolve, `document.fonts.check` true, no console errors. |
| **Skipping the styleguide** | It's the deliverable — generate it with embedded fonts (§6). |
| **Leaving favicon/PWA/share unset** | "Branding" ≠ just the palette — **derive the rasters** from the logo SVG (§4). |
| **Eyeballing "dominant" colors** | Count frequency + filter widget noise + confirm against the logo (§1). You'll get lucky until the noise isn't obvious. |
| **Uploading the logo into the CMS** | Prepare files and hand off; the `informations` upload is the content step, not theming (§4). |
| **Hardcoding brand hex in components** | Theme through Vuetify semantic tokens (§2). |
