---
name: deploy-nimbou-site
description: Use when deploying a nimbou-stack site (thin Laravel shell + Nuxt SPA + nimbou-cms admin, one shared MariaDB) to cPanel shared hosting that is FTP-only (no SSH) with per-subdomain MultiPHP — first-time go-live OR a redeploy of an already-live site. Prevents symptoms like a MySQL 8 dump rejected by MariaDB, the SPA calling localhost, CMS images 404, .env web-reachable, and a redeploy silently wiping a month of production content. NOT the SEO cutover (that is nimbou-seo-migrate + golive).
---

# Deploy a Nimbou site to cPanel (FTP-only)

## Overview

Publish a nimbou site — **thin Laravel shell** (serves SEO meta + `/api/{module}` + sitemap, docroot = its `public/`) + **Nuxt SPA** built into that `public/` + separate **nimbou-cms admin** on a subdomain (docroot = its `public/`) — to **cPanel shared hosting with FTP only, no SSH, MariaDB, per-subdomain MultiPHP**. Site and admin share ONE database.

Because there is no server shell, everything is done from the local machine: build with production values **baked in**, ship files by FTP, and run privileged steps (unzip, DB import) through a **token-protected one-shot PHP helper** hit over HTTPS, then deleted. Source of the proven mechanism: `helpers.md` (in this skill).

**Two branches — detect first (Step 1):**
- **First deploy** (prod DB empty): guided cPanel provisioning + full dump/restore.
- **Redeploy** (site already live): **code/build only by default. The production DB is the source of truth — do NOT import your local dump.** DB import is opt-in and always backs up first.

Follow steps in order. ⚠️ markers are where agents guess wrong or cause data loss.

## Step 0 — Interview + transient secrets

Collect (these can't be derived), and **write them to `deploy.env` in the scratchpad only** — never in the repo:
- `SITE_URL`, `ADMIN_URL` — decide **www vs non-www first**; the same host string goes into `APP_URL`, `API_BASE`, `FILE_BASE_URL`, and the canonical redirect.
- `DB_*` (host usually `localhost`, name/user **with the cPanel account prefix** — see ⚠️ below), FTP host/user/pass, docroots.
- Confirm this is **first deploy or redeploy** (or let Step 1 detect it).

⚠️ **Secrets are transient:** `deploy.env`, the SQL dump, and helper `.php` files hold credentials and a password hash. They live in the scratchpad, are gitignored, and are **secret-scanned before any commit**. Deploy is outward-facing and irreversible — **confirm with the user before the first upload and before any DB import.**

## Step 1 — Detect the branch

Probe the live host: `curl -s -o /dev/null -w '%{http_code}' <SITE_URL>/api/informations`. A 200 with real data = **redeploy** (go to Step 6). Anything else / greenfield = **first deploy** (Step 2).

## Step 2 — Provision in cPanel (first deploy only — guided, then verified)

The skill does **not** click cPanel. Guide the user through these, then **verify each automatically** before continuing:
1. **Two docroots → `public/`.** Point the site domain and the admin subdomain each at their own `public/`. ⚠️ Non-negotiable — it keeps `.env`, `vendor/`, and `admin/app/Core/DB.php` out of the web root. Do NOT use the "app outside webroot + edit `index.php` require paths" layout; nimbou serves `public/` directly (the repo `.htaccess` rewrites to `public/` only as a fallback, and then `.env` must be denied explicitly).
2. **MultiPHP → 8.2 or 8.3 per subdomain.** ⚠️ New subdomains default to old PHP; the admin's deps need ≥8.2. Set BOTH explicitly.
3. **MySQL Databases → create DB + user, ALL PRIVILEGES.** ⚠️ cPanel **prefixes** the names: a DB asked as `foo` becomes `acct_foo`. The prefixed name is what goes in `.env` (`DB_DATABASE`) and admin `DB.php`.

Verify (via the helper or a first upload): DB connects, PHP version ≥8.2, docroot serves `public/`. Only advance when all pass. Reuse `_dbcheck.php` from `helpers.md` to prove the prefixed DB name/host.

## Step 3 — Build the SPA with production values baked in

⚠️ The API base is **frozen into the JS at build time** (`nuxt.config.ts`: `define: { __API_BASE__: JSON.stringify(process.env.API_BASE) }`). It can never be fixed on the server. Edit `resources/nuxt/.env`:
```
API_BASE=<SITE_URL>/api            # same origin as the site; NEVER localhost/staging
NUXT_PUBLIC_USE_MOCKS=false        # ⚠️ often left =true after local dev/staging
```
```bash
cd resources/nuxt && pnpm install && pnpm generate
```
**Pre-flight the bundle before it goes anywhere** — this is the only way to catch a bad bake:
```bash
grep -rlE 'localhost|127\.0\.0\.1|api-staging' .output/public/_nuxt && echo "STOP: bad API base baked" || echo "clean"
grep -rl '<SITE_URL host>' .output/public/_nuxt >/dev/null && echo "prod base present"
```
Copy `.output/public/{_nuxt,index.html,200.html,404.html,*.svg}` → `public/`. ⚠️ **Preserve** `public/{index.php,.htaccess,favicon.ico,robots.txt}` — `index.php` is the Laravel front controller; overwriting it kills the API/SEO. Restore `resources/nuxt/.env` → `NUXT_PUBLIC_USE_MOCKS=true` for local dev afterward.

## Step 4 — Package the app (first deploy: full; redeploy: only the SPA)

Vendor must ship prebuilt (no composer on the server):
```bash
composer install --no-dev --optimize-autoloader
```
⚠️ Delete `bootstrap/cache/config.php` (and cached routes) before packaging — a stale cached config pins your **local** DB creds and ignores prod `.env`.

Zip for transport (thousands of tiny `vendor/` files stall over plain FTP). ⚠️ **Exclude only the TOP-LEVEL** `resources/`, `docs/`, `tests/`, `.git/` **by full path** — a name-based robocopy `/XD resources` also matches `vendor/symfony/string/Resources` (needed by the autoloader) and silently breaks the app. Stage from a **short path** (e.g. `C:\www\_dp\...`) to dodge MAX_PATH.

Config surface (hand-written, gitignored, uploaded outside `public/`):

| File | Keys |
|---|---|
| site `.env` | `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=<SITE_URL>`, `APP_KEY=` (⚠️ generate locally `php artisan key:generate --show`, paste — no SSH to run it), `DB_*`=prefixed names, `FILE_BASE_URL=<ADMIN_URL>` (⚠️ prefixes CMS image URLs — omit it and every image 404s) |
| admin `app/Core/DB.php` | `define('DB_HOST','localhost')`, `DB_DATABASE`/`DB_USER`=prefixed, ⚠️ `define('DB_PASSWORD', …)` — the admin reads **`DB_PASSWORD`**, not `DB_PASS` |

## Step 5 — Upload + extract + import (first deploy)

1. FTP the site zip to the site app-root and the admin zip to the admin app-root; FTP `admin/public/upload/` (gitignored image tree) → `<ADMIN_DOCROOT>/upload/`.
2. Upload `_deploy_extract.php` (from `helpers.md`, **fresh random token per run**) into each `public/`, hit it once over HTTPS, confirm `OK`, then **delete it and the zip**.
3. **Sanitize the dump for MariaDB** (⚠️ a MySQL 8 dump fails on the first `CREATE TABLE` otherwise): `utf8mb4_0900_ai_ci` → `utf8mb4_unicode_ci`; strip `DEFINER=…` / set VIEWs `SQL SECURITY INVOKER` (else error 1227, needs SUPER). Prefer a **full dump/restore** — it preserves module ids (1=informations, 2=ramos, …) so `images.modules_id` and `/upload/<id>/…` line up; migrations recreate module rows via `LAST_INSERT_ID()` and drift on a non-empty DB.
4. FTP the sanitized `.sql` outside the web root; run `_deploy_import.php` (token) once — it reads `.env`, imports via `mysqli::multi_query` in utf8mb4, echoes row counts. **Delete the importer and the `.sql` immediately** (the dump carries the admin password hash).
5. ⚠️ **Rotate the admin password** — the imported hash is your local/dev one. Reset via the admin UI or a fresh hash into `accounts`.

## Step 6 — Redeploy (site already live)

⚠️ **The single most destructive mistake is "deploy = also load my local dump." Do not.** Production is the source of truth; your local DB is older and wrong; importing it wipes a month of staff CMS edits and orphans uploaded images.

Default redeploy = **frontend/code only**:
1. Rebuild the SPA (Step 3, same prod env + pre-flight grep).
2. Upload only the new `_nuxt/*` + `index.html` (Nuxt content-hashes chunks → atomic swap). Incremental FTP via `resources/nuxt/scripts/upload.js` (`pnpm upload`, `deleteRemote:false`) is fine.
3. **Touch nothing else:** not `.env`, not `DB.php`, not `upload/`. ⚠️ If your FTP client has mirror/sync, **disable delete-extraneous** — a mirror against your local tree deletes prod-only uploads.

**DB import on redeploy is opt-in only** — and even then, **back up the destination DB first** (mandatory): dump prod via `_deploy_export.php`/Adminer before the import runs. No backup, no import.

## Step 7 — Smoke (HTTP; visual → browser-smoke)

```bash
curl -s -o /dev/null -w 'site:%{http_code}\n'  <SITE_URL>/
curl -s -w 'api:%{http_code}\n'                <SITE_URL>/api/informations   # 200 + real data
curl -s <SITE_URL>/sitemap.xml | head; curl -s -o /dev/null -w 'admin-login:%{http_code}\n' -X POST <ADMIN_URL>/rest/auth/login -H 'Content-Type: application/json' -d '{"email":"…","password":"…"}'
curl -s -o /dev/null -w 'env-leak:%{http_code}\n' <SITE_URL>/.env            # MUST be 403/404
```
- ⚠️ Validate CMS images in **keep-alive** (`curl -K` with a URL list) — bursts of fresh HTTPS connections trip the host firewall and return `000` false-negatives.
- Confirm `APP_DEBUG=false`, helpers/zip/dump return **404** (deletion verified, not assumed), and `robots.txt` **allows** indexing (⚠️ staging uses `Disallow: /`; do not carry it to prod).

## Gotchas

| Symptom | Cause / fix |
|---|---|
| Import fails on first `CREATE TABLE` / VIEW error 1227 | MySQL 8 dump into MariaDB. `utf8mb4_0900_ai_ci`→`utf8mb4_unicode_ci`; strip DEFINER / VIEW `SQL SECURITY INVOKER`. |
| "Unknown database" on import or admin login | cPanel name prefix. Use `acct_<name>` in `.env` + `DB.php`. |
| Admin can't connect | Admin constant is `DB_PASSWORD`, not `DB_PASS`. |
| Admin subdomain fatals | MultiPHP left at <8.2. Set 8.2/8.3 per subdomain. |
| `.env`/`DB.php` downloadable, or site 500 | Docroot not `public/`. Point docroot→`public/` per subdomain. |
| Autoload breaks (`symfony/string/Resources` gone) | Name-based zip exclude hit `vendor/**/Resources`. Exclude top-level by full path only. |
| SPA shows mock/empty, or calls `localhost/api` | Built with `USE_MOCKS=true` or wrong `API_BASE`. Rebuild — not a server edit. Pre-flight grep the bundle. |
| CMS images 404 | Missing/incorrect `FILE_BASE_URL=<ADMIN_URL>` in site `.env`. |
| Prod pins local DB creds after upload | Stale `bootstrap/cache/config.php` shipped. Delete cached config before packaging. |
| Image check returns `000` | Firewall on connection bursts. Verify in keep-alive (`curl -K`). |
| Site deindexed after go-live | Staging `robots.txt Disallow: /` carried to prod. Ship an indexable robots + sitemap. |

## Red flags — STOP

- On a **redeploy**, about to import/restore your local DB dump. **Production is authoritative — DB import is opt-in and backs up first.** "Deploy always includes the DB" is the wrong reflex.
- Running any import without dumping the **destination** DB first. No backup, no import.
- Leaving the token PHP helper, the zip, or the `.sql` on the server. **Verify each returns 404** — deletion is a step, not cleanup-later.
- `git add`/commit without secret-scanning; committing `deploy.env`, `.env`, `app/Core/DB.php`, or any `sftp.json`. **Never.**
- **Guessing** env-var names or the admin DB constant. Use the exact ones here (`API_BASE`, `NUXT_PUBLIC_USE_MOCKS`, `DB_PASSWORD`, `FILE_BASE_URL`).
- Building with `NUXT_PUBLIC_USE_MOCKS=true` / a localhost `API_BASE`, or overwriting `public/index.php`/`.htaccess` with SPA output.
- Reaching for Adminer/BigDump or the whole-app-in-`public_html` layout. Use the token helper + docroot→`public/`.
- Doing the **SEO cutover** here (301 revalidation, sitemap→GSC, www canonical, privacy page). That is **out of scope** → hand off to `nimbou-seo-migrate` (owns the 301 map) + the `golive` step. This skill ends at "site + admin 200, smoke green."
