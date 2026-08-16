---
name: port-redesign-nimbou-site
description: Use when a nimbou site's pages must be rebuilt FAITHFUL to a redesign delivered as a page-builder export — self-contained HTML with inline CSS plus a `<script data-dc-script>` (Duda/.dc.html, Framer, Webflow) — either because a content-first build drifted from the redesign, or a new site must match the export. Covers header/hero/sections and internal pages, CMS-driven, desktop+mobile. NOT theming tokens/fonts (theming-nimbou-site), NOT designing pages from scratch (nuxt-think/nuxt-plan), NOT building CMS modules (laravel-*/nimbou-cms-wire).
---

# port-redesign-nimbou-site

## Overview

Rebuild nimbou pages **faithful to a page-builder export**, wired to the CMS. The export is the **specification**; the **rendered DOM** is the fidelity target and the source of truth (measured, never eyeballed — the browser pane doesn't composite, so screenshots are blank). This skill **orchestrates** the rest of the plugin — it does not re-plan or duplicate it.

Core principle: **port the render, keep the CMS as content, measure the DOM to prove it.** Fidelity is to what the export *looks like*, free in implementation (scoped CSS or Vuetify — whatever is cleanest); it is **not** a 1:1 copy of the builder's markup or its runtime JS.

**Announce at start:** "I'm using the port-redesign-nimbou-site skill to rebuild these pages faithful to the redesign."

## When to use

- A site built content-first **diverged** from the redesign (over-simplified: missing utility bar, hero photo, carousels, filters) and must be brought back to fidelity — page by page.
- A new nimbou site must match an export (`.dc.html`/Duda, Framer, Webflow) — self-contained HTML + inline CSS + a `data-dc-script`.

**Not** for: theming tokens/fonts (`theming-nimbou-site`); designing a page from scratch with no export (`nuxt-think`/`nuxt-plan`); building/wiring CMS modules (`laravel-think`/`laravel-execute`/`nimbou-cms-wire`); the SEO cutover or deploy (`nimbou-seo-migrate`/`golive-`/`deploy-nimbou-site`).

## Boundary — what this skill OWNS vs DELEGATES

| Concern | Owner |
|---|---|
| Parse the export → **fidelity inventory** (sections, tokens, states, copy/lists) | **this skill** |
| Map each section → component → CMS module (the **port manifest**) | **this skill** |
| The port itself + the **gotchas** below + **QA by measurement** | **this skill** |
| Palette/type tokens already applied to the skeleton | `theming-nimbou-site` (assumed done) |
| Page/component design decisions (splits, state, reuse) | feed the fidelity inventory as a brief into `nuxt-think` → `nuxt-plan`; **do not re-plan** |
| A CMS module the redesign needs but that doesn't exist | **detect the gap, hand off** to `laravel-think`/`laravel-execute` + `nimbou-cms-wire` — never hardcode, never build it here |

## Shape — 3 stages

1. **Discovery of fidelity.** Read the export (desktop **and** mobile) as spec. Produce the fidelity inventory + the **port manifest** (qa-harness.md §7): every block → component → CMS source, with the export hash pinned. Identify reusable components against the catalog (below) and flag CMS gaps.
2. **Plan by delegation.** Hand the inventory to `nuxt-think` as the design brief and let `nuxt-plan` produce the component/execution plan. This skill adds the fidelity + CMS + QA layer on top — it does not invent a parallel plan.
3. **Execute + QA.** Build per the plan honoring the gotchas; wire the CMS; then run the QA harness and fill the **fidelity checklist gate** (qa-harness.md §6) at 1280 and 375 before the page is "done".

## The export as input — the `data-dc-script`

The `<script data-dc-script>` carries **data** and **state/interaction**, not behavior to port:
- **Data** (copy, lists, card arrays) → replace with the CMS: fetch `/api/{module}` via the project's model/store/composable. **Delete the hardcoded array** — never ship the export's inline data.
- **Interactions** (filter chips, tabs, carousel, modal) → **re-derive** them from the HTML/CSS using the project's shared components and Vue/Vuetify patterns. Do **not** port the builder's runtime JS.

Derive category/grouping from stable content keys (e.g. `slug`) rather than adding a redundant CMS column, unless the taxonomy is genuinely editorial.

## Reusable components — catalog first

Match each export section against the recurring nimbou patterns before creating new ones; reuse the shared **header / footer / quote modal**. Common catalog entries: **PageHero** (breadcrumb + eyebrow + title + optional background photo), **CtaBand** (WhatsApp CTA strip), **AboutMedia** (prefer video, else photo, else fallback), **CardGrid/carousel** of CMS items with filter chips. What doesn't match the catalog becomes a new, named component (and a candidate to add to the catalog).

## Gotchas — the payload (each caused real breakage)

| Gotcha | Rule |
|---|---|
| **Content images** | Use a plain `<img>`, **not `<v-img>`**. `v-img` is lazy (`IntersectionObserver`) and never fires in a non-compositing pane → renders blank and reads as broken. Validate every image by **HTTP 200 + `naturalWidth>0`** (qa-harness.md §2), not by looking. |
| **Sticky header** | Keep the export's `position:sticky`. It breaks when nested in short wrappers → add `display:contents` to each wrapper up to the page root so the block-parent is the whole page (`v-application__wrap`). **Do not** replace it with `v-app-bar`/`position:fixed` — that changes the layout and the fidelity. Prove it pins (qa-harness.md §3). |
| **QA viewport** | Screenshots are **blank** (pane doesn't composite) and `resize_window` may not change the render viewport. **Force the viewport in JS + dispatch `resize`** and measure `clientWidth`/`scrollWidth`/`getBoundingClientRect` (qa-harness.md §1). Measure the DOM; don't trust a screenshot. |
| **Reactivity** | `stores.get('<module>').get()` returns a **Ref**. In `<script>` read `.value`; in `<template>` it auto-unwraps. Mixing these up yields `undefined` or a `[object]`. |
| **Auto-import dedup** | Nuxt dedups repeated path segments: `components/Section/Home/HomeSeguros.vue` → `<SectionHomeSeguros>` (not `SectionHomeHomeSeguros`). Name and reference by the deduped id. |
| **Fidelity ≠ markup copy** | Match the **render** (color, spacing, type, layout, states) measured at the viewport. Implement it the cleanest way; don't reproduce the builder's classes/DOM. |

## Reproducibility

- **Port manifest** (qa-harness.md §7) is the versioned tracing artifact: export hash → block → component → CMS source. Commit it under `docs/<phase>/`.
- **Second port / updated export:** hash the new export, diff its section inventory against the manifest, emit an **impact report**, and apply **surgical edits** to the mapped components only. **Never blind-overwrite** a component — later hand edits live in it.
- **Fidelity checklist** is the reexecutable acceptance gate; the human sign-off row is mandatory (measurement proves not-broken; a person confirms it matches the redesign).

## Common mistakes (verbatim from greenfield baselines without this skill)

| Mistake | Do instead |
|---|---|
| `<v-img :src cover>` for CMS card images | Plain `<img>` (§gotchas) — v-img's lazy loader never fires without compositing. |
| Swapping sticky for `v-app-bar` ("position:sticky would also work") | Keep `position:sticky` + `display:contents` on wrappers; prove it pins (qa-harness.md §3). |
| "Desktop @1280: **screenshot**… compare screenshots against the export" | Screenshots are blank — **measure the DOM** (qa-harness.md §1–5). |
| `resize_window` + reload, then assume mobile is verified | Force viewport in JS + `dispatchEvent('resize')`; if unconfirmable, report "unverified", don't guess. |
| Verifying images by visual diff | HTTP 200 + `naturalWidth>0` per image (qa-harness.md §2). |
| Shipping the export's inline `data-dc-script` array | Delete it; feed the list from `/api/{module}` via a composable. |
| Adding a redundant CMS `category` column | Derive grouping from `slug`/stable keys unless the taxonomy is editorial. |
| Hardcoding content the redesign needs but has no module for | Flag the CMS gap and hand off to `laravel-*`/`nimbou-cms-wire`. |
| Re-planning the pages inside this skill | Feed the fidelity inventory into `nuxt-think`/`nuxt-plan`; add only the fidelity+CMS+QA layer. |

## Real-world impact

On the amazoniaseguros rebuild, a content-first build passed IA/copy checks but visibly diverged from the redesign; recovering fidelity took Fases 8/8b/8c to rediscover these gotchas one breakage at a time. A greenfield agent without this skill, handed the same export, used `v-img` (blank cards), dodged sticky with `v-app-bar`, and proposed screenshot-based QA — all three defeated in this environment. This skill delivers the verified method directly.
