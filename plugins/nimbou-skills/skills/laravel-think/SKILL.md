---
name: laravel-think
description: Use when designing the PHP side of a content feature on a nimbou site (Laravel shell + nimbou-cms admin) — a new content type/module, a dynamic route, or a change to how the site exposes CMS data — before writing code. Drives the design (view type, fields, routing/SEO, module reproducibility) to an approved brief. NOT for the Nuxt frontend (use nuxt-think) and NOT for Clean-Architecture/NestJS backends.
---

# laravel-think (nimbou)

## Overview

Drive the **PHP-side design** of a content feature into an approved brief, working **within nimbou-cms conventions** (not Clean Architecture — the "backend" is a thin Laravel shell + a custom-PHP CMS). Output is a short design the user approves before `laravel-plan` turns it into steps.

**REQUIRED REFERENCE:** read `docs/nimbou-cms-guidelines.md` (in the project / nimbou-site-starter) — the data model, view types, field-type catalog, `/api` shapes, SEO wiring, and export/import limits. Don't re-derive it. The frontend is out of scope → hand off to `nuxt-think`.

## When to use

- "Add a new content type / module to the site", "add a dynamic route with SEO", "change what `/api/<x>` returns".
- **Not** for: Nuxt pages/components (`nuxt-think`), pure admin-framework changes (new field types), or non-nimbou Laravel apps.

## The design decisions to resolve

Work through these and record the answers as the brief:

1. **View type.** Singleton content → **Item** (one row, id=1). A collection of items → **Table** (many rows, `active=1` + visibility window). Approval workflow → ApprovalTable.
2. **Fields.** For each field pick a `key` + type from the catalog (§4 of the guide). ⚠️ **The field `key`s ARE the API/frontend contract** — name them deliberately (`short_description`, `long_description`, `image`…). Prefer scalar types; **avoid `category`/`subcategory`/`tags` when the frontend needs the readable value** — the site returns them **raw (int id / JSON)**, only `imageFile`/`file` are enriched.
3. **Slug / URL.** There is **no slug field and the id is the real key**. Default: URL = `Str::slug(title)-{id}`, resolved by `RouteHelper::getIdFromSlug` (id visible in URL). A **clean slug** (`/seguros/auto`, no id) requires **new PHP** (a `where('slug',…)` lookup + a `slug` field + a matching frontend route) — only take it if the client insists.
4. **Ordering.** ⚠️ `TableView::index` hard-codes `ORDER BY created_at DESC`; there is **no order column** on Table content tables. Editor-controlled ordering is **not** available via the API as-is. Options: accept created_at order; add a `number` field and sort on the frontend; or (last resort) patch `TableView`. Decide now.
5. **Routing & SEO — only if the content has its OWN public page.** ⚠️ Decide first: does this content type need a dedicated URL (a list page and/or a per-item page), or is it rendered **inside an existing page/section** (e.g. a testimonials block on the homepage)?
   - **Own page(s):** add **entries to `config/pages.php`** (a `meta` array/closure + a `sitemap` closure for `{slug}` routes). No controller edits — `web.php` injects `<head>`, the body is Nuxt.
   - **Inside an existing page (no dedicated URL):** **change nothing in `config/pages.php`.** The generic `/api/<key>` is enough; the existing page's route already injects its own `<head>`. Do NOT add a list/`{slug}` route or a sitemap entry — that would be dead code, and there is no page to verify SEO on.
6. **Reproducibility across environments.** How does the module definition travel dev→prod (usually separate DBs)? This is a real fork — see below; capture the choice in the brief.
7. **Frontend boundary.** PHP owns: the generic `/api/<key>` JSON, per-route `<head>` SEO, `sitemap.xml`, and the admin CRUD UI. Everything visible is Nuxt. The contract = module key + view type + field keys. Note the handoff explicitly.

## Reproducibility fork (decide in the brief)

**Always build the module through the admin first** (it runs the real DDL — correct FK names, columns, seed row). Then capture a *versioned artifact* that can rebuild it on a clean DB. The acceptance bar for any artifact: **applying it to a fresh starter DB reproduces the admin-built schema (diff them).**

| Approach | Fidelity | Notes |
|---|---|---|
| **Export JSON** (admin Export button → `Module::export`) re-applied via the module-add path (`Module::add`) | **Schema faithful** | Re-running add invokes the real `afterAddModule` → identical columns + **correct FK names**. Loses only field `options`/`unique`/`private` → capture those alongside and re-apply. No import UI, so re-add + option re-apply is a manual step. |
| **SQL dump of the generated schema** (`mysqldump` the `modules`/`modules_fields` rows + the `CREATE TABLE mod_<key>`) into a numbered `admin/database/migrations/` file | **Full** — *if dumped, not hand-written* | ⚠️ Do NOT hand-author the DDL: the `imageFile` FK must be named exactly `mod_<key>_<field>` with `ON DELETE SET NULL ON UPDATE SET NULL` (the admin looks it up by that name to edit/drop the field). Dumping the real generated schema avoids this footgun. Pin `modules_fields_types_id` to the seeded ids. |
| Hand-written SQL migration | fragile | The FK-name/`ON UPDATE` footgun above makes a schema that *looks* right but breaks later admin edits. Avoid unless you diff-validate against the admin-built table. |
| Manual UI steps | none | Not versioned; diverges between envs. |

**Content (rows + uploaded images) is never carried by any of these** — re-enter in prod, or dump/restore `mod_<key>` + `images` rows + `public/upload/<moduleId>/…` files (⚠️ the module id may differ between envs, changing image paths).

## Output — the design brief

A short doc the user approves:
- View type + rationale.
- Field table: `key` → type → notes (mark relational/enriched).
- Slug + ordering decisions (with the constraints above).
- Route(s) to add to `config/pages.php` (with meta/sitemap sketch).
- Reproducibility approach chosen (+ the "rebuild on a clean DB" acceptance bar).
- Frontend handoff for `nuxt-think`/`nuxt-plan`: module key, view type, field-key contract, image `{featured,list}` shape, **and any client-side responsibilities the API can't do** — especially: sort order (the API always returns `created_at DESC`, so if the brief chose a manual `order` field the frontend MUST sort by it), and resolving raw `category`/`tag` ids. A handoff missing the sort instruction silently ships the wrong order.

Get explicit approval, then `laravel-plan`.

## Common mistakes

- Choosing `category`/`tags` for something the frontend must display readably (site returns raw ids/JSON).
- Assuming editor-controlled ordering works. `TableView` returns `created_at DESC`; the `order` value ships in the JSON but the sort is the frontend's job — say so in the handoff.
- Adding a list/`{slug}` route + sitemap for content that lives inside an existing page (dead code + nothing to verify). Only route content that has its own URL.
- Promising clean id-free URLs without budgeting the extra PHP.
- Treating `imageFile` as single — the API always returns `{ featured, list }`; the frontend reads `image.featured?.path`.
- Trusting a hand-written SQL migration as "lossless" — the FK-name footgun breaks later admin edits. Dump the generated schema or use export→re-POST, and diff against the admin-built table.
- Relying on `number` for validated ranges (e.g. 1–5 rating) — there is no min/max enforcement; it's a data-entry + frontend convention.
