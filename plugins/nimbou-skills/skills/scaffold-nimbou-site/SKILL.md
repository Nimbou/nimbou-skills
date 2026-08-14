---
name: scaffold-nimbou-site
description: Use when creating a brand-new Nimbou website project from scratch — first-time bootstrap of a new client site on the nimbou stack (Laravel shell + Nuxt frontend + nimbou-cms admin + Docker) so site, admin and DB come up green locally, and optionally a private GitHub repo + continuation issue. Windows/Docker host, no PHP/MySQL/admin rights needed.
---

# Scaffold a new Nimbou site

## Overview

Bootstrap a new site by cloning **`github.com/Nimbou/nimbou-site-starter`** (monorepo: Laravel 11 shell + Nuxt 4/Vuetify frontend + `admin/` nimbou-cms + `docker/`), bringing site+admin+DB up green in Docker, then creating a private repo + issue. Everything PHP/MySQL runs in containers — the host only needs Docker, Node+pnpm, git, `gh`. **No PHP/Composer/MySQL install, no admin rights.**

The starter's `README.md` is the source of truth for structure. This skill adds the interview, multi-site isolation, the **deterministic DB bootstrap**, secret hygiene, and repo/issue creation. Follow the steps **in order** — several ordering details matter (see ⚠️ markers).

## Step 1 — Interview (AskUserQuestion)

Ask up front (these can't be derived):
- **Domain** (e.g. `cliente.com.br`).
- **Site display name** (`APP_NAME`, proper casing/accents — e.g. "Cliente Ltda").
- **GitHub org + visibility** (default **Nimbou / private**).
- **Admin password** to set for the seed account (or generate one and report it).
- Confirm **create repo + push + issue** at the end (default yes) — this publishes; re-confirm before Step 9.

Derive **`slug`** = domain lowercased with all non-alphanumerics removed (`cliente.com.br` → `clientecombr`). Used for folder DB name, and compose project name.

## Step 2 — Clone

```bash
git clone git@github.com:Nimbou/nimbou-site-starter.git C:/www/<domain>
cd C:/www/<domain>
rm -rf .git   # fresh history; re-init in Step 9
export COMPOSE_PROJECT_NAME=<slug>   # isolation becomes the default; still safe to pass -p <slug>
```

## Step 3 — Pick a free port block, then configure

Each site needs host ports: **site**, **admin**, **db**. Scan for free ones (empty output = free):

```bash
for p in 8090 8091 3308; do echo -n "$p: "; powershell -Command "Get-NetTCPConnection -State Listen -LocalPort $p -EA SilentlyContinue" | grep -q . && echo BUSY || echo free; done
```

Rule: **site** from 8090 stepping +10 per site, **admin = site+1**, **db** from 3308 stepping +1. (Nuxt dev is fixed at 3000 — run one site's `pnpm dev` at a time, or `pnpm dev -- --port 3010`.) Then edit:
- `docker-compose.yml`: `db` → `MYSQL_DATABASE/USER/PASSWORD: <slug>`, ports `<dbPort>:3306`; `site` ports `<sitePort>:80`; `admin` ports `<adminPort>:80`.
- `cp .env.example .env`, then edit **`.env`** (never the example): `APP_NAME="<display name>"`, `APP_URL=http://localhost:<sitePort>`, `DB_DATABASE/USERNAME/PASSWORD=<slug>`, `FILE_BASE_URL=http://localhost:<adminPort>`. Leave `DB_HOST=db`, `DB_PORT=3306` (containers reach the DB over the compose network, not the host port).
- `cp resources/nuxt/.env.example resources/nuxt/.env`, then set `API_BASE=http://localhost:<sitePort>/api` and **`NUXT_PUBLIC_USE_MOCKS=false`** (else the built site renders mock data and green #1 is meaningless).

## Step 4 — DB up (wait healthy), then Composer (both projects)

```bash
docker compose -p <slug> up -d db
# poll until healthy:
for i in $(seq 1 40); do st=$(docker inspect --format '{{.State.Health.Status}}' $(docker compose -p <slug> ps -q db) 2>/dev/null); echo "db: $st"; [ "$st" = healthy ] && break; sleep 4; done

docker compose -p <slug> run --rm --no-deps site  composer update --no-dev -W --no-interaction
docker compose -p <slug> run --rm --no-deps admin composer install --no-interaction
```

⚠️ **Site uses `update --no-dev -W`, not `install`** (lock resolved on 8.4; image is 8.3). Advisory blocking is already disabled in the starter's `composer.json`. Windows bind-mount = slow (run in background, wait for completion, don't poll by re-reading vendor).

## Step 5 — Deterministic DB bootstrap (NOT the web installer)

Start from a clean DB (only if re-running after a failure: `docker compose -p <slug> down -v` then redo Step 4). Import ALL migrations in sort order, **forcing utf8mb4** (else accents double-encode):

```bash
ls admin/database/migrations/*.sql | sort | while IFS= read -r f; do cat "$f"; printf '\n'; done \
  | docker compose -p <slug> exec -T db mysql -uroot -proot --default-character-set=utf8mb4 <slug>
```

Hand-write **`admin/app/Core/DB.php`** (gitignored via the nested `admin/.gitignore`; note `DB_USER`/`DB_DATABASE`, NOT `DB_USERNAME`):

```php
<?php
define('DB_HOST', 'db');
define('DB_DATABASE', '<slug>');
define('DB_USER', '<slug>');
define('DB_PASSWORD', '<slug>');
```

Laravel key:

```bash
docker compose -p <slug> run --rm --no-deps site php artisan key:generate --force
```

## Step 6 — Bring up site+admin, then set password + seed

⚠️ Do `up -d` **before** any `exec` (the admin container must be running):

```bash
docker compose -p <slug> up -d
sleep 4

# set a known admin password (seed hash is unknown):
HASH=$(docker compose -p <slug> exec -T admin php -r "echo password_hash('<chosen-pass>', PASSWORD_DEFAULT);")
docker compose -p <slug> exec -T db mysql -uroot -proot <slug> \
  -e "UPDATE accounts SET password='$HASH' WHERE email='contato@nimbou.com.br';"

# seed one informations row so /api/informations returns 200.
# ⚠️ real columns: id,name,short_name,description,keywords,img,share,icon,mask_icon — there is NO 'whatsapp' column.
docker compose -p <slug> exec -T db mysql -uroot -proot --default-character-set=utf8mb4 <slug> \
  -e "INSERT INTO mod_informations (id,name,short_name,description) VALUES (1,'<display name>','<short>','<desc>') ON DUPLICATE KEY UPDATE name=VALUES(name);"
```

(WhatsApp, social, logo etc. are added later as **module fields in the admin**, not columns here.)

## Step 7 — Build frontend → public/

```bash
cd resources/nuxt && pnpm install && pnpm generate
robocopy .output\public ..\..\public /E   # PowerShell. NOTE: robocopy exit 1 = success (0 = nothing copied); do NOT treat exit!=0 as failure
cd ../..
```

`DirectoryIndex index.php` keeps `/` routed through Laravel (reads `index.html`, injects SEO from `informations`). The Nuxt build is gitignored — regenerate per clone.

## Step 8 — Verify three greens

```bash
curl -s -o /dev/null -w 'site: %{http_code}\n' http://localhost:<sitePort>/
curl -s -w '\napi: %{http_code}\n' http://localhost:<sitePort>/api/informations       # 200, name accents correct
curl -s -o /dev/null -w 'login: %{http_code}\n' -X POST http://localhost:<adminPort>/rest/auth/login \
  -H 'Content-Type: application/json' -d '{"email":"contato@nimbou.com.br","password":"<chosen-pass>"}'   # 202
```
All three must be 200/200/202. If `/api/informations` 500s → the seed failed (check columns). If `/` 404s → the build isn't in `public/`.

## Step 9 — Secret scan (HARD STOP) → git → repo → issue

⚠️ **Scan BEFORE committing. A non-empty result is a stop, not a warning** — the crisdiel base historically shipped `.vscode/sftp.json` with production FTP creds.

```bash
git init -b main && git add -A
# This MUST print nothing (the query-builder code file Utility/DB.php is excluded, not a secret):
git ls-files | grep -iE 'sftp|(^|/)\.env($|\.)|/DB\.php$|auth\.json|\.pem$|id_rsa|vendor/|node_modules/|\.output/' | grep -v 'app/Core/Model/Utility/DB.php'
# and confirm the real secrets are ignored (each must print a rule):
git check-ignore .env admin/app/Core/DB.php resources/nuxt/.env .vscode/sftp.json
```

If the scan lists anything sensitive: remove it, gitignore it, and if already committed `git rm --cached`, `git commit --amend`, `git push --force`, then **tell the user to rotate the credential**. Only when clean:

```bash
git commit -m "Initial commit: <domain> (nimbou site)"
# generate the issue body first (don't pass a nonexistent file):
cat > /tmp/issue.md <<'EOF'
## Contexto
Scaffold inicial (site Laravel + Nuxt + admin nimbou-cms + Docker) rodando verde localmente.

## Próximos passos
- [ ] Design system / identidade visual
- [ ] Modelar módulos no CMS (além de informations)
- [ ] Construir páginas do site
- [ ] Conteúdo + SEO
- [ ] Deploy
EOF
gh repo create "Nimbou/<domain>" --private --source=. --remote=origin --push
gh issue create --repo "Nimbou/<domain>" --title "<domain> — próximos passos" --body-file /tmp/issue.md
```

## Gotchas

| Symptom | Cause / fix |
|---|---|
| `composer install` fails `symfony/* requires php >=8.4` | Use `composer update --no-dev -W` (site). |
| Accents show as `Ã´`/mojibake | Import/insert without utf8mb4. Always `--default-character-set=utf8mb4`. |
| `/api/informations` 500 `ImageFileField::mapItem(... null)` | `mod_informations` empty or seed failed (wrong columns — no `whatsapp`). Seed id=1 with real columns. |
| `exec admin` → "no container for service admin" | You ran `exec` before `up -d`. Bring services up first (Step 6). |
| `/` 404/500 | Nuxt build not in `public/`, or mocks left on. `pnpm generate` + copy; set `NUXT_PUBLIC_USE_MOCKS=false`. |
| Second site won't `up` / wrong data | Port collision or shared volume. Unique ports + `COMPOSE_PROJECT_NAME`/`-p <slug>`. |
| robocopy "failed" (exit 1) | Exit 1 = success. Don't gate on exit==0. |

## Red flags — STOP

- About to `git add`/push without the Step 9 secret scan, or treating a non-empty scan as non-blocking. **Scan is a hard stop.**
- Committing `.env`, `admin/app/Core/DB.php`, `auth.json`, or any `sftp.json`. **Never.**
- Using the admin **web installer** instead of the deterministic import (Step 5). It can drop `main.sql` and breaks on `;` in data.
- Importing/inserting without `--default-character-set=utf8mb4`.
- Any `docker compose` (especially `down -v`) without `-p <slug>`/`COMPOSE_PROJECT_NAME` set — you can wipe another site's volume.
- Seeding `mod_informations` with a `whatsapp` column (it doesn't exist).
