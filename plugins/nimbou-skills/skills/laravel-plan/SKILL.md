---
name: laravel-plan
description: Use after laravel-think's design is approved, to write the implementation plan for the PHP side of a nimbou content feature (nimbou-cms module + Laravel-shell routing/SEO + reproducible module definition) as ordered steps/files. NOT for the Nuxt frontend (use nuxt-plan) and NOT for Clean-Architecture/NestJS backends.
---

# laravel-plan (nimbou)

## Overview

Turn an **approved `laravel-think` design brief** into an ordered, file-level implementation plan for the **PHP side**, within nimbou-cms conventions. The frontend page is a separate plan (`nuxt-plan`).

**REQUIRED:** an approved brief from `laravel-think`, and `docs/nimbou-cms-guidelines.md` for the mechanics. Don't re-derive the design here — plan it.

## When to use

- Right after `laravel-think` produces an approved design for a content feature.
- **Not** for Nuxt work (`nuxt-plan`), and not without an approved brief.

## Plan structure (order matters)

Produce a plan with these phases; each step names the exact file/endpoint and its acceptance check.

**1 — Build the module in the dev admin (real DDL) + enter content.** Add the module (view type + fields from the brief, pinned to the catalog), upload images, set `active=1`. Building through the admin runs the real `afterAddModule`/`Field::add`/`ImageFile::afterAdd` — so columns, seed row (Item), and FK names are correct by construction.

**2 — Capture the versioned artifact (do NOT hand-author DDL).** Per the brief's choice:
- *Export→re-add (schema-faithful):* use the admin Export button (`Module::export`), commit the JSON **plus** a note of each field's `options`/`unique`/`private` (export drops them). Re-applying = the admin module-add path (`Module::add`, re-runs `afterAddModule` → identical schema incl. FK names) then re-set the options.
- *Schema dump (full):* `mysqldump` the module's `modules`/`modules_fields` rows + the generated `CREATE TABLE mod_<key>` into a numbered `admin/database/migrations/` file. Pin `modules_fields_types_id` to the seeded ids. ⚠️ Never hand-write the `imageFile` FK — the dump carries the exact `mod_<key>_<field>` name + `ON DELETE/UPDATE SET NULL` the admin needs.

**3 — Validate the artifact on a clean DB (acceptance barrier).** Apply the artifact to a fresh starter DB and **diff its schema against the admin-built `mod_<key>`** (columns, types, FK name/rules) + confirm the `modules`/`modules_fields` rows match. The artifact is not "done" until this passes — otherwise a wrong FK name ships and only breaks later in prod / on a field edit.

**4 — Site-shell wiring — ONLY if the content has its own public URL.** If the brief gave it a dedicated page: edit `config/pages.php` to add the list route and/or `{slug}` route with `meta` (`Module::get('<key>')->show(RouteHelper::getIdFromSlug($slug))`) + `sitemap` closures. No `ModuleController`/`web.php` edits (the API is generic). **If the content renders inside an existing page/section (e.g. homepage): change nothing here** — skip `config/pages.php` entirely.

**5 — Verify.** Always: `GET /api/<key>` (list `{data:[...]}`), `GET /api/<key>/{id}` (table only), and field `key`s match the contract. **Only if a public route was added:** `/sitemap.xml` contains the URLs and view-source of a `{slug}` page shows injected `<title>`/OG. Do not verify SEO/sitemap for a routeless (section) content type — there's nothing to check.

**6 — Frontend handoff.** Emit for `nuxt-plan`: module key, view type, field keys, image `{featured,list}` shape, **client-side responsibilities the API can't do** (sort — the API returns `created_at DESC`, so a manual `order` field must be sorted on the frontend; resolving raw `category`/`tag` ids), and whether there's a public route or it's a section. Do NOT plan Nuxt files here.

**7 — Dev→prod reproduction.** Apply the *validated* artifact on prod (separate DB). **Content + images are NOT carried** — re-enter, or dump/restore `mod_<key>` + `images` rows + `public/upload/<moduleId>/…` (⚠️ the `<moduleId>` path segment changes if the prod module id differs → image paths break; verify/remap). Keep site-repo (`config/pages.php`, if any) and admin-repo (artifact) changes in lockstep for the deploy.

## Output

An ordered checklist (files + acceptance per step), the versioned module-definition artifact spec, and the frontend handoff contract. Group into waves where steps are independent (e.g. capturing the artifact and — when there is one — the `config/pages.php` route edit can proceed in parallel; artifact-validation and the API check are barriers).

## Common mistakes

- Hand-authoring the `mod_<key>` DDL instead of dumping the admin-generated schema — the `imageFile` FK must be named `mod_<key>_<field>` with `ON DELETE/UPDATE SET NULL` or later admin edits break.
- Shipping the artifact without the clean-DB validation (Step 3) — a wrong FK name passes every API check and only fails in prod.
- Not pinning `modules_fields_types_id` → wrong field type on a differently-seeded DB.
- Adding a `config/pages.php` route + sitemap for content that renders inside an existing page — then trying to verify SEO that doesn't exist. Route only content with its own URL.
- Assuming content/images travel with the schema (they don't); forgetting the `<moduleId>` image-path drift between envs.
- Editing `ModuleController`/`web.php` — the API and route loop are generic.
- Handing off to the frontend without the sort/transform responsibilities (manual `order`, raw category ids), or planning Nuxt files here instead of `nuxt-plan`.
