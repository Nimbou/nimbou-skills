---
name: golive-nimbou-site
description: Use when a nimbou site has just been deployed live at the client's REAL domain — a same-domain cutover replacing an old indexed site — and its SEO must survive the switch. Prevents symptoms like the 301s only ever tested on localhost, a wrong canonical host in the sitemap, a privacy URL stuck as a permanent 301 to home, and a sitemap pushed to Search Console before the real domain is verified. NOT building the 301 map (nimbou-seo-migrate) nor the deploy itself (deploy-nimbou-site).
---

# Go-live a Nimbou site (SEO cutover activation)

## Overview

The site is **already deployed and live at the real domain** (`deploy-nimbou-site` done, site+admin 200) and the **301 redirect map already exists** (`nimbou-seo-migrate` built `config/redirects.php` + the `Route::fallback`, verified on localhost). This skill is the **activation layer**: turn the key at the real domain so Google re-indexes the new structure and ranking equity survives.

**Core principle — verify on the REAL domain before you tell Google anything.** Localhost passing proves nothing about production: TLS, http→https, www/non-www, and `APP_URL` all differ at the edge, and submitting a sitemap before the canonical host and 301s are proven just teaches Google the wrong map.

**Announce at start:** "I'm using the golive-nimbou-site skill to activate the SEO cutover."

## When to Use

- A nimbou site just went live at a domain that previously served an old, indexed site.
- The 301 map and the acceptance script already exist (from `nimbou-seo-migrate`).
- **Not** for a brand-new domain with no SEO history (nothing to preserve — skip to a plain sitemap submit).
- **Not** building/discovering the redirect map (that is `nimbou-seo-migrate`) and **not** deploying files/DB (that is `deploy-nimbou-site`).

## Boundary

- **In scope:** canonical-host activation, re-running the existing 301 acceptance against the **real** domain, robots/sitemap sanity, shipping the real privacy page + swapping its placeholder redirect, and the **owner-gated** Search Console submission + follow-up monitoring.
- **Out of scope:** discovering old URLs or authoring the old→new map (`nimbou-seo-migrate` owns it — reuse its list and script), uploading files/DB.
- **Assumes** you have the discovered old-URL list from the migration phase and Search Console **owner access** (you do not stand up parallel properties).

## Procedure

### 1. Fix the canonical host — it feeds the sitemap and canonical tags
Decide **www vs non-www ONCE**, matching what the old site/GSC used (confirm with the owner — flipping it mid-migration sheds authority). That host must be identical in:
- **`APP_URL`** in the production site `.env`. ⚠️ **FTP-only host — there is no SSH/artisan on the server.** `APP_URL` is whatever you uploaded; there is no `php artisan config:cache` to run. If a stale `bootstrap/cache/config.php` was shipped it pins the wrong host — **delete it via FTP** (Laravel falls back to `.env`). The dynamic `/sitemap.xml` (`SitemapController`) and every canonical/OG tag are built from `APP_URL`.
- **Edge redirects** (web server / cPanel / CDN — **not** `Route::fallback`, which only sees requests that already reached this host): `http → https` and `www → non-www` (or the reverse), each a **301**. Confirm the TLS cert's SAN covers **both** apex and `www`, else the `www→apex` redirect throws a cert error before it can redirect.

```bash
curl -sSI http://<domain>/          # expect 301 → https://<canonical>/
curl -sSI https://www.<domain>/     # expect 301 → https://<canonical>/  (per owner's choice)
curl -sS  https://<canonical>/ | grep -iE '<title>|canonical|og:url'   # host must be <canonical>, never localhost/staging
```

### 2. Re-run the EXISTING 301 acceptance against the real domain
Do **not** re-derive the check — re-run `nimbou-seo-migrate`'s HTTP acceptance script with `BASE=https://<canonical>`, driven by the **full discovered old-URL list** (not a sample). Assert, per URL:
- **301** (not 302 — equity only transfers on 301), single hop (no `301→301`), and the `Location` **target itself returns 200** (a 301 into a 404 is worse than the original 404).
- Real new pages still return **200** (the fallback didn't shadow them); a never-existed URL still returns **404**.

Any old URL that 404s = a gap → add it to `config/redirects.php` (data only) and re-run. This is activation, not re-mapping.

### 3. robots + sitemap sanity
```bash
curl -sS  https://<canonical>/robots.txt
curl -sSI https://<canonical>/sitemap.xml            # 200 + xml
curl -sS  https://<canonical>/sitemap.xml | head -40 # canonical host, new 200 URLs only
```
- ⚠️ `robots.txt` must **not** carry the staging `Disallow: /` (the classic cutover disaster — instant deindex). It allows crawling and ends with `Sitemap: https://<canonical>/sitemap.xml`.
- No `<meta name="robots" content="noindex">` survived from staging (grep home + a deep page).
- The sitemap lists new-site 200 URLs on the **canonical** host — no `localhost`, no old URLs, no `www` if canonical is non-www. (It's generated from `APP_URL` + `config/pages.php`; fix the host by fixing `APP_URL`, step 1, not by editing a file.)

### 4. Ship the real privacy page, then swap its placeholder redirect
The migration left `/politica-de-privacidade-e-seguranca` as a **temporary 301 → `/`** (no page existed yet). ⚠️ Leaving a **permanent 301 to the homepage** is wrong twice: the policy stays invisible (legal exposure for an insurer) and Google consolidates the URL into the home, deindexing it. The fix is to **ship the page**, not to soften it to a 302:
1. Create the privacy page — a route in `config/pages.php` (title/description for SEO) + a `pages/*.vue` (static legal copy; hand heavy design to `nuxt-think`). Rebuild the SPA and deploy it (`deploy-nimbou-site` redeploy path).
2. **Change the `config/redirects.php` target** for `/politica-de-privacidade-e-seguranca` from `/` to the new page path.
3. Verify: old URL **301 → new privacy path**, and the new path returns **200** with the right `<title>`. It is now in the sitemap.

### 5. Submit to Search Console — OUTWARD-FACING, owner-gated (STOP)
⚠️ This publishes intent to Google and requires the owner's property. **Do NOT submit until steps 1–3 pass on the real domain, and confirm with the owner first** (you need access to the *existing* GSC property — do not create a parallel one that fragments history).
- Submit `https://<canonical>/sitemap.xml` under **Sitemaps**; confirm it reads with 0 errors. Prefer a **Domain property** (DNS TXT) — one property covers http/https/www/non-www.
- **URL-inspect + Request Indexing** the homepage and the top few money pages to nudge a recrawl.
- ⚠️ Do **not** use **Change of Address** — that is for a domain-to-domain move; this is the **same domain**, so 301s + sitemap are the correct signal. Do **not** mass-**Remove** old URLs — the 301s deindex them cleanly.
- Bing Webmaster Tools (optional, cheap): import from GSC, submit the same sitemap.

### 6. Analytics continuity + monitoring (confirm with owner)
- Confirm the analytics tag (GA4 / owner's) fires on the **new** production pages with the **same** measurement/property ID (a rebuild often drops the snippet — historical continuity breaks silently).
- Over the following weeks watch GSC **Pages/Coverage** (old URLs → "Page with redirect", new URLs → indexed), **Crawl stats** (a 404 spike = an un-mapped old URL → add it to `config/redirects.php`), and the **Redirects** report.

## Common Mistakes

| Footgun | Reality |
|---|---|
| Submitting the sitemap to GSC before the real-domain checks pass | Teaches Google the wrong map. Verify canonical + 301s on the real host first; submission is owner-gated. |
| `php artisan config:cache` / assuming SSH | FTP-only host — no artisan. `APP_URL` lives in the uploaded `.env`; delete a stale `bootstrap/cache/config.php` via FTP. |
| Verifying only on `localhost` | TLS/www/canonical/`APP_URL` differ at the edge. Re-run every check against the real domain. |
| Softening the privacy redirect to a 302→home | Still hides the policy (legal) and parks the URL. Ship the real page and repoint the 301 to it. |
| Re-deriving or re-discovering the 301 map | That's `nimbou-seo-migrate`. Here you only re-run its script and patch gaps found on the real domain. |
| Staging `robots.txt Disallow: /` or `noindex` carried over | Instant full deindex. Ship an indexable robots + sitemap line; grep pages for `noindex`. |
| Change of Address tool / mass Removals | Same-domain cutover — 301s + sitemap are the signal; Change of Address is for domain moves, Removals can drop pages you want consolidated. |
| Flipping www/non-www vs the old site | Sheds accumulated authority. Match the old canonical; confirm with the owner. |

## Red flags — STOP

- About to **submit the sitemap / request indexing** without the owner's confirmation and their existing GSC property, or before steps 1–3 pass on the **real** domain. This is outward-facing — confirm first.
- Leaving `/politica-de-privacidade-e-seguranca` as a **permanent 301 to `/`**. Ship the page and repoint the redirect — not a 302 band-aid.
- Reaching for `php artisan …` on the server. The host is FTP-only; there is no shell.
- **Rebuilding** the redirect map or re-running discovery here. Out of scope → `nimbou-seo-migrate`.
- Carrying a staging `Disallow: /` or `noindex` to production.
