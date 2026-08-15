---
name: laravel-execute
description: Use when an approved laravel-plan (or equivalent brief) for a nimbou-cms content module needs to be physically built — creating the module and fields in the dev admin, capturing the versioned migration, validating it on a clean DB, and wiring config/pages.php routing/SEO. The "execute" step after laravel-think and laravel-plan. For nimbou-cms (custom PHP admin), NOT Laravel MVC or NestJS.
---

# laravel-execute (nimbou)

## Overview

The **execute** step of the nimbou backend triad (`laravel-think → laravel-plan → laravel-execute`). Takes an approved `laravel-plan` and materializes the **PHP/backend** side: builds the nimbou-cms module, captures a versioned migration, validates it on a clean DB, and — when the content has its own public URL — wires `config/pages.php` routing/SEO.

**Core principle — build through the admin's REST, then DUMP the generated schema.** `Field::add` cannot be bootstrapped standalone (the admin framework couples to its HTTP entry point). So you build the module with **one authenticated `POST /rest/modules`** against the running admin — that runs the real `afterAddModule` + `Field::add`, producing correct columns and FK names by construction. Then you **dump** that generated schema (`SHOW CREATE TABLE`) into a numbered migration — **never hand-write the DDL** (the imageFile/category FK must be named `mod_<key>_<field>`; hand-writing it breaks later admin edits). Finally you **validate on a clean DB** (apply all migrations in order, diff).

**Announce at start:** "I'm using the laravel-execute skill to build this module."

## When to Use

- After `laravel-plan` produces an approved plan for a nimbou-cms module.
- **Not** without a plan (go through `laravel-think`/`laravel-plan` first).
- **Not** for the Nuxt frontend (that's `nuxt-plan`/`executing-plans`) or NestJS backends.

## Boundary

- **In scope:** the module (via REST) + the versioned migration + clean-DB validation + `config/pages.php` route/SEO wiring **when the content has its own public URL**. All PHP/backend.
- **Out of scope:** seeding content rows/images, and any Nuxt frontend wiring — those are separate steps/skills. Content never travels with the migration; it is re-entered per environment.
- **Environment:** dev/local (Docker) only. Reproducing in prod is a deploy concern.

## Execution shape

Reuse the **structure** of `nimbou-skills:executing-plans` (Step 1: load the plan, review it critically, establish the checkout; commit per step; collect follow-ups) but run a **sequential executor** — do NOT dispatch `run-waves`. The steps are HTTP-against-the-admin + mutations on a shared DB, so they are sequential barriers (build → dump → validate); there is nothing to fan out or isolate in a worktree.

## Procedure

Credentials come from **env vars** (`AMZ_ADMIN_URL`, `AMZ_ADMIN_EMAIL`, `AMZ_ADMIN_PASSWORD`) — never hardcode or commit them.

### 1. Pre-flight
- Read the plan; confirm module `key`, view type (Item vs Table), and the field list with types.
- **Abort if the module already exists** (`GET`/DB check for the key, or the admin returns "Já existe um módulo com essa chave"). Re-running duplicates rows — clean first, don't force.

### 2. Build the module — one `POST /rest/modules`
Login → `POST /rest/auth/login {email,password}` → `token`. Authenticate every call with a **raw** `Authorization: <token>` header — **NOT `Bearer <token>`** (Bearer → 401).

```python
import os, requests
B = os.environ.get("AMZ_ADMIN_URL", "http://localhost:8081")
s = requests.Session()
tok = s.post(f"{B}/rest/auth/login", json={
    "email": os.environ["AMZ_ADMIN_EMAIL"], "password": os.environ["AMZ_ADMIN_PASSWORD"],
}).json()["token"]
s.headers["Authorization"] = tok                       # raw token, no "Bearer"

payload = {
  "name": "Prêmios", "key": "premios", "icon": "fas fa-trophy",
  "viewId": 2,                                          # 2=Table, 3=Item (modules_views)
  "viewOptions": {"listHeaders": ["title"]},           # column shown in the admin list
  "fields": [                                           # type = numeric modules_fields_types_id
    {"name": "Título", "key": "title", "type": 1, "unique": 0, "options": {}},
    {"name": "Foto",   "key": "image", "type": 8, "unique": 0, "options": {}},
    {"name": "Ordem",  "key": "sort_order", "type": 15, "unique": 0, "options": {}},
  ],
}
r = s.post(f"{B}/rest/modules", json=payload)          # 202 + module list on success; 500 = failed
```

A single POST creates the `modules` row, the `mod_<key>` table (Table) or seed row (Item), the `modules_fields` rows, the columns, and the FKs. No per-field calls needed.

### 3. Capture the versioned migration (DUMP, don't hand-write)
Dump the generated schema and definition rows (db container, root/root):

```bash
docker exec <db> mysql -uroot -proot amazonia -e "SHOW CREATE TABLE mod_<key>\G" | sed 's/AUTO_INCREMENT=[0-9]* //'
```

Write the next-numbered file `admin/database/migrations/NNN. migration_<date>.sql` in the house style of the existing ones: an `INSERT INTO modules (...)` + `SET @m=LAST_INSERT_ID()` + `INSERT INTO modules_fields (...)` (pin `modules_fields_types_id` to the ids below), then the **verbatim** `CREATE TABLE` body from the dump. Header comment notes it's the dumped generated schema and that content doesn't travel.

### 4. Validate on a clean DB (acceptance barrier)
Apply **every** migration in order into a throwaway DB and diff against the dev-generated table.

```bash
# ⚠️ migration filenames contain SPACES → never `cat $(ls *.sql)`; loop with quoting:
: > /tmp/all.sql; ls -1 "$MIG"/*.sql | sort | while IFS= read -r f; do cat "$f" >> /tmp/all.sql; echo >> /tmp/all.sql; done
docker exec <db> mysql -uroot -proot -e "DROP DATABASE IF EXISTS amz_val; CREATE DATABASE amz_val CHARACTER SET utf8mb4;"
docker exec -i <db> mysql -uroot -proot --default-character-set=utf8mb4 amz_val < /tmp/all.sql
# ⚠️ the db container has no `diff`. Dump both SHOW CREATE to the HOST and diff there:
docker exec <db> mysql -uroot -proot amazonia -N -e "SHOW CREATE TABLE mod_<key>\G" | sed 's/AUTO_INCREMENT=[0-9]* //' > /tmp/live.txt
docker exec <db> mysql -uroot -proot amz_val -N -e "SHOW CREATE TABLE mod_<key>\G" | sed 's/AUTO_INCREMENT=[0-9]* //' > /tmp/val.txt
diff /tmp/live.txt /tmp/val.txt && echo "IDENTICAL"
docker exec <db> mysql -uroot -proot -e "DROP DATABASE amz_val;"
```

Pass = clean-DB schema **identical** to the admin-built one. (Note: `imageFile`'s column is `INT` only because migration 025 flips its `sql_type` before your migration runs — the ordered apply is what proves that.)

### 5. Route + SEO — ONLY if the content has its own public URL
If the plan gives it a dedicated page, add the route to `config/pages.php` (`meta` with `title`/`description`/`image`, and a `sitemap` closure for `{slug}`). For **clean slugs** (`/seguros/{slug}` with no id), resolve by filtering the module index on the `slug` field — NOT `RouteHelper::getIdFromSlug`. If the content renders inside an existing page, change nothing here.

### 6. Verify
- `GET /api/<key>` returns `{data:[...]}` with the right field keys (Table) / the item (Item).
- If a public route was added: the `{slug}` page's `<title>`/OG are injected, and `/sitemap.xml` contains the URL.

## Field-type reference

`type` in the `fields` payload is the numeric `modules_fields_types_id`. Verified generated columns:

| Type key | id | Generated column | Notes |
|---|---|---|---|
| `tinyText` | 1 | `varchar(255)` | |
| `mediumText` | 6 | `varchar(300)` | |
| `bigText` | 7 | `text` | |
| `number` | 15 | `int` | |
| `price` | 16 | (numeric) | |
| `switchBoolean` | 12 | (bool int) | |
| `email` / `url` | 2 / 11 | `varchar` | |
| `date` / `time` / `datetime` | 23 / 24 / 5 | date/time types | |
| `imageFile` | 8 | `int` + FK `mod_<key>_<field>` → `images(id)` **ON DELETE/UPDATE SET NULL** | API enriches to `{featured,list}` |
| `file` | 9 | `varchar(255)` | stores the path directly (NOT an FK) |
| `category` | 4 | `int` + FK `mod_<key>_<field>` → `categories(id)` (plain RESTRICT — **no** SET NULL, unlike imageFile) | API returns the raw id |
| `subcategory` | 10 | `int` | no DB FK |
| `tags` | 17 | `json` | API returns raw JSON |
| `collection` | 19 | `json` | |
| `collectionWithKey` | 20 | `json` | array of `[a,b]` pairs; API returns it as a **JSON string** → frontend `JSON.parse` |

## Common Mistakes

| Footgun | Reality |
|---|---|
| A field keyed `order` | **`order` is a MySQL reserved word** — the default `ALTER TABLE ... ADD order` runs WITHOUT backticks and fails. Rename to `sort_order` (and sort on the frontend). |
| `Authorization: Bearer <token>` | The admin reads a **raw** token. Bearer → 401. |
| Hand-writing the migration DDL | The imageFile/category FK must be named `mod_<key>_<field>` with the exact `ON DELETE/UPDATE` rule. Hand-writing it looks right but breaks later admin field edits. **Dump `SHOW CREATE`.** |
| `cat $(ls *.sql)` in validation | Migration filenames contain **spaces** → word-splitting breaks the apply. Loop with `while IFS= read -r f`. |
| `diff` inside the db container | The container has no `diff`. Dump to the host and diff there. |
| Skipping the clean-DB validation | A wrong FK name / type passes every API check and only breaks in prod or on a field edit. The diff is the acceptance bar. |
| Running `Field::add` from a CLI script | It can't bootstrap standalone (framework couples to the HTTP entry). Build via `POST /rest/modules`. |
| Re-running on a populated DB | Creates a duplicate module (or errors). Check existence first; clean before re-seeding. |

## Real-World Impact

Reverse-engineering this from the admin source (no skill) took a capable agent ~46 tool calls / ~108k tokens and still missed the `order` reserved-word footgun. This skill delivers the verified mechanics directly.
