---
name: nimbou-cms-seed
description: Use when a nimbou-cms content module already exists and its rows (and images) must be loaded reproducibly from a data file via the admin REST — including re-running the same seed on dev and then on production without duplicating rows or orphaning images. The content-seeding step after laravel-execute built the module. For nimbou-cms (custom PHP admin), not Laravel seeders or a SQL import.
---

# nimbou-cms-seed

## Overview

Content never travels with a schema migration — `laravel-execute` ships the module's **structure**, and the **rows + images are re-entered per environment**. This skill is that step: load a module's content from a versioned data file through the admin REST, **idempotently**, so the same seed runs on dev now and on production later and converges to one row per item, one image per row.

**Core principle — upsert by a natural key, and serialize the way the generic column-setter expects.** The admin's Table update is a **generic column writer with no per-field-type processing**: it writes each value verbatim. So `collectionWithKey` must be sent as a **pre-serialized JSON string** (not an array), `imageFile` must be the **int FK** obtained from a **separate two-step multipart upload** (not the path, not the POST return), and a new row lands `active=0` — the seed must flip it to `1` or it never appears on `/api`. And because `POST` always creates, re-running a naive seed **duplicates rows**; the seed must **find-or-create by a unique key** and **reuse the existing image** instead of re-uploading.

**Announce at start:** "I'm using the nimbou-cms-seed skill to seed this module's content."

## When to Use

- A nimbou-cms module exists (built via `laravel-execute`) and its `/api/<key>` responds, and you have the content in a data file.
- **Not** to build the module or its schema (that's `laravel-execute`).
- **Not** to extract the content (scraping the old site / parsing PDFs is a **separate** step that produces the data file).
- **Not** the Nuxt frontend wiring (that's `nimbou-cms-wire`).

## Boundary

- **In scope:** loading rows + images into an existing module via the admin REST, idempotently, from a versioned JSON/YAML data file; and verifying the result.
- **Out of scope:** the module build, content extraction, and any frontend wiring. Content does **not** travel with the migration — this seed is the per-environment re-entry.
- **Environment:** dev/local (Docker) now; the **same script** re-runs against prod (separate DB). Credentials come from **env vars** — never hardcode or commit them.

## Procedure

### 1. Pre-flight
- Confirm the module exists and the **data-file keys mirror the module's field keys** (`GET /rest/modules` embeds each module's `fields` — read the keys from there; a mismatched key PUTs into nothing, silently).
- **Pick the upsert key.** Default to the module's field marked **`unique`** (e.g. `slug`). If the module has **no unique field** (e.g. a team or awards module), the data file / seed must **declare which field is the key** — do not fall back to blind append, that reintroduces the duplication footgun.

### 2. Data-file convention
The file (JSON/YAML, versioned in the repo) is one object per row, keys mirroring the module fields, with two special representations:

| Field type | In the data file | Sent to the API as |
|---|---|---|
| scalars (tinyText/mediumText/bigText/number/…) | the raw value | the raw value |
| `collectionWithKey` | a **native array** of pairs `[[a,b],…]` | `json.dumps(...)` — a **JSON string** |
| `imageFile` | a **local path** to the image file | the **int FK** from the upload (below) |
| `category`/`tags` | the raw id / array | the raw id / JSON (API returns them raw too) |

### 3. The seed chain (reference pattern)
Login → **raw `Authorization: <token>` header (NOT `Bearer`)**. Build the `key→id` map once, then upsert each row. Success is **HTTP 202** (not 200).

```python
import json, mimetypes, os, sys, requests
B   = os.environ.get("SEED_ADMIN_URL", "http://localhost:8081") + "/rest"
KEY = "ramos"; UNIQUE = "slug"; IMG_FIELD = "image"
JSON_FIELDS = ["coberturas", "faq"]          # collectionWithKey → serialize
SCALARS = ["name","slug","hero_title","intro","whatsapp_message","seo_description","sort_order"]

s = requests.Session()
s.headers["Authorization"] = s.post(f"{B}/auth/login", json={           # raw token, no "Bearer"
    "email": os.environ["SEED_ADMIN_EMAIL"], "password": os.environ["SEED_ADMIN_PASSWORD"]}).json()["token"]

mod = next(m for m in s.get(f"{B}/modules").json() if m["key"] == KEY)   # /modules embeds fields
img_field_id = next(f["id"] for f in mod["fields"] if f["key"] == IMG_FIELD)
by_key = {r[UNIQUE]: r["id"] for r in s.get(f"{B}/{KEY}").json() if r.get(UNIQUE)}

def image_already_set(item_id):                                          # skip re-upload → no orphans
    imgs = s.get(f"{B}/modules-images/{item_id}", params={"fieldId": img_field_id}).json()
    return imgs[0]["id"] if imgs else None

for row in json.load(open(os.environ["SEED_DATA"], encoding="utf-8")):
    rid = by_key.get(row[UNIQUE]) or s.post(f"{B}/{KEY}").json()["id"]   # find-or-create
    payload = {k: row[k] for k in SCALARS if row.get(k) is not None}
    payload.update({k: json.dumps(row[k], ensure_ascii=False) for k in JSON_FIELDS if row.get(k)})
    img_id = image_already_set(rid)                                      # reuse if present
    if img_id is None and row.get(IMG_FIELD) and os.environ.get("FORCE_IMAGES") != "0":
        path = os.path.join(os.environ.get("SEED_ASSETS", "."), row[IMG_FIELD])
        with open(path, "rb") as fh:                                     # two-step multipart upload
            up = s.post(f"{B}/modules-images/image",
                        data={"fieldId": img_field_id, "itemId": rid},
                        files={"image": (os.path.basename(path), fh,
                                         mimetypes.guess_type(path)[0] or "application/octet-stream")})
        img_id = up.json()["id"]
    if img_id is not None:
        payload[IMG_FIELD] = img_id                                      # write the FK back onto the row
    payload["active"] = 1                                                # else the row never hits /api
    s.put(f"{B}/{KEY}/{rid}", json=payload)                             # 202 = ok
```

### 4. Idempotency (the whole point)
- **Rows:** keyed by `UNIQUE` — existing key ⇒ PUT onto the same id (in-place); new key ⇒ one `POST`. A second run never duplicates and never trips the unique constraint.
- **Images:** the upload endpoint inserts an `images` row and returns its id but does **not** set the FK — the seed writes it back. On re-run, **skip the upload if the row already has an image** (`image_already_set`), or every run leaves a new **orphan** `images` row. Re-upload only behind an explicit `--force-images` flag when the art actually changed.

### 5. Verify (acceptance bar)
```bash
# count matches the source file
curl -s http://localhost:8080/api/<key> | python -c "import sys,json;print(len(json.load(sys.stdin)['data']))"
```
Assert: `GET /api/<key>` count **==** data-file count; a spot-checked item's field keys/values match; each `image.featured.path` resolves **200** (`curl -I`); `collectionWithKey` comes back as the `[[a,b],…]` string shape. **Then run the seed a second time and confirm it's a no-op** — no new rows on `/api`, no new `images` orphans. The re-run being clean is what proves the upsert, not the first run.

### 6. dev → prod
Re-run the same script with prod `SEED_ADMIN_URL` + prod creds. Content and images are re-entered, not copied. ⚠️ Image URLs embed the module id (`/upload/<moduleId>/…`); if the prod module id differs from dev, the paths differ — that's fine because the seed re-uploads per environment, but never hand-copy dev image paths into prod.

## Common Mistakes

| Footgun | Reality |
|---|---|
| Skipping images as "too hard / do by hand" | The two-step multipart upload + FK write-back is the highest-value part. A capable agent under time pressure punts it; the seed then ships content with no images. Implement it. |
| Sending `collectionWithKey` as an array | The Table update is a generic column setter — it writes the value verbatim into a `json` column. Send `json.dumps(...)`, a **string**. |
| `imageFile` = the path, or the upload's own return as the column value | The column is an **int FK**. Upload via `POST /rest/modules-images/image` (multipart), then **PUT the returned id** onto the row's image field. |
| Forgetting `active = 1` | New rows are created `active=0`; `TableView::index` filters `active=1`. Without the flip the row exists but never appears on `/api`. |
| `Authorization: Bearer <token>` | The admin reads a **raw** token. Bearer → 401. |
| Re-running a plain `POST` loop | `POST` always creates → duplicates (and trips the `unique` key). Find-or-create by the unique field. |
| Re-uploading the image every run | Each upload inserts a new `images` row; without skip-if-set you accumulate **orphans**. Reuse the existing image; re-upload only on an explicit force flag. |
| Data-file key ≠ module field key | The PUT writes only real columns; a mismatched key is silently dropped. Read field keys from `GET /rest/modules`. |
| Expecting HTTP 200 | The admin returns **202** on a successful write. Accept any 2xx. |

## Real-World Impact

Given a clean nimbou repo, an existing module, and a realistic "quick, reproducible seed" ask, a capable agent under mild time pressure traced the source correctly for the scalar mechanics (json-string, `active=1`, upsert-by-slug) but **skipped the entire image mechanism**, punting it to manual work — and each baseline spent **~90–115k tokens and 20–36 tool calls** rediscovering the generic-column-setter constraints. This skill delivers the full chain — including the image two-step and the idempotent image reuse — directly.
