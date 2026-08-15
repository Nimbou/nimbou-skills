---
name: nimbou-seo-migrate
description: Use when a new nimbou site is about to replace an existing live site at the same domain and the old site's indexed URLs must keep their SEO across the cutover — discovering the old URLs, mapping each to a new destination, and serving 301s so rankings survive. The SEO-migration step of a nimbou rebuild. For the nimbou Laravel shell (config/pages.php + Route::fallback), not a generic web-server redirect task.
---

# nimbou-seo-migrate

## Overview

When a nimbou rebuild replaces a live site at the **same domain**, every URL Google already indexed becomes a `404` on cutover unless you redirect it. This skill is the **301 layer**: discover the old indexed URLs, map each to its best new destination, and implement the redirects in the nimbou Laravel shell — so ranking equity carries over instead of evaporating.

**Core principle — discovery drives mapping, and the redirect layer is a single `Route::fallback` registered last.** You cannot map URLs you have not discovered; guessing old slugs/ids ships wrong redirects that look right. And the redirect logic goes in **one `Route::fallback`, after the `config('pages')` loop and `require api.php`** — so it fires *only* when no real new-site route matched, and can never shadow a live page.

**Announce at start:** "I'm using the nimbou-seo-migrate skill to migrate the old site's SEO."

## When to Use

- A nimbou site is about to go live at a domain that currently serves an old site with indexed URLs.
- **Not** for a brand-new domain with no history (nothing to preserve).
- **Not** the CMS module build (that's `laravel-execute`), sitemap submission, DNS, or www-canonicalization — those are go-live follow-ups, out of scope here.

## Boundary

- **In scope:** URL discovery, the proposed old→new map (human-approved), `config/redirects.php` + the `Route::fallback`, and the HTTP acceptance check. All site-repo PHP.
- **Out of scope:** submitting the new `sitemap.xml` to Search Console, www vs non-www canonicalization, creating a real privacy page — document these as go-live follow-ups; don't execute them.
- **Assumes** the old site is still **live and crawlable** during the migration (the dominant rebuild case) and the new site's routes already exist in `config/pages.php`.

## Procedure

### 1. Discover the complete old URL set — DO NOT trust the old sitemap
Union multiple sources, dedupe (strip query strings + trailing slashes), then classify each row:

- **Google Search Console (authoritative):** Pages report → export all indexed URLs; the "Not found (404)" and "Page with redirect" tables; Performance → Pages (every URL that ever earned an impression — these carry the equity).
- **A live crawl of the old site** (Screaming Frog / `wget --spider -r`) to catch deep URLs the reports miss — especially per-item pages (`/noticias/{slug}/{id}`, `/seguros/{slug}/{id}`) with their **real** slugs/ids.
- **Backstops:** `site:` operator, Bing Webmaster Tools, server access logs (Googlebot hits), Wayback `web.archive.org/cdx`, Ahrefs/SEMrush top pages + backlinks.

⚠️ **The old builder's `/sitemap.xml` frequently lies** — page-builder sites (studiomega and friends) often return the home HTML with a 200, not a real sitemap. Open it and confirm it's actually `<urlset>` XML before using it; if it isn't, discard it and lean on GSC + the crawl. Never let it be your only source.

**Do this before cutover** — once the old site is gone, the crawl and logs evaporate.

### 2. Propose the map — stop for human approval
Read the **new** routes in `config/pages.php`, then propose the old→new mapping. **Semantic mapping is a judgment call, not a slug heuristic** (`/beneficios`→`/empresa`, `/trabalhe-conosco`→`/contato`). Bucket the discovered URLs into:

- **`exact`** — old section path → new path (1:1).
- **A pattern group** for per-item legacy URLs whose id is dropped (e.g. `/seguros/{slug}/{id}` → `/seguros/{new-slug}`), with an **explicit old-slug→new-slug table** for the ones whose slug changed.
- **Retired content** — see step 3.

Present the proposed map and **wait for approval** before writing code. The exact old slugs/ids in the pattern table come from step 1's discovery — **never inferred**; a fabricated `seguro-auto→auto` that ships is a silent wrong redirect.

### 3. Retired content — surface 301-vs-410, let the human decide per group
Content with **no** new equivalent (a retired blog, a videos section) has two defensible dispositions. Present the trade-off and get a per-group decision — do not silently default:

| Option | Effect |
|---|---|
| `301` → nearest section / home | Preserves any link equity, but many-to-one → home is a classic **soft-404** Google may reject and is slow to deindex. |
| `410 Gone` | Tells Google the content is deliberately gone — clean, fast deindex — but discards whatever equity those URLs held. |

### 4. Implement — one `config/redirects.php` + one `Route::fallback` (last)
Keep the map as **data** in `config/redirects.php`; keep the logic in a single `Route::fallback` at the **end** of `routes/web.php`, after the pages loop and `require api.php`:

```php
// config/redirects.php
return [
  'exact' => [
    '/a-empresa'        => '/empresa',
    '/beneficios'       => '/empresa',
    '/nossa-equipe'     => '/equipe',
    '/mais-solucoes'    => '/seguros',
    // ...approved section map...
  ],
  'ramos' => [                      // old slug => new slug (only the ones that changed)
    'ap-acidentes-pessoais' => 'acidentes-pessoais',
    'seguro-moto'           => 'moto',
  ],
];
```

```php
// routes/web.php — AFTER the config('pages') loop, /sitemap.xml, and require api.php
Route::fallback(function (\Illuminate\Http\Request $request) {
  $path = "/" . trim($request->path(), "/");          // normalizes trailing slash; ->path() strips the query
  $redirects = config("redirects");

  if (!empty($redirects["exact"][$path])) {
    return redirect($redirects["exact"][$path], 301);  // ⚠️ pass 301 — redirect() defaults to 302
  }
  if (preg_match("#^/seguros/([a-z0-9-]+)/\d+$#", $path, $m)) {   // old /seguros/{slug}/{id}
    $new = $redirects["ramos"][$m[1]] ?? null;
    return redirect($new ? "/seguros/$new" : "/seguros", 301);   // unknown slug → hub, never a dead 404
  }
  if (preg_match("#^/(noticias|videos)(/|$)#", $path)) {         // retired — per step 3's decision
    return redirect("/", 301);                                   // ...or `abort(410)` if the group chose Gone
  }
  abort(404);                                          // never existed → real 404
});
```

Why `Route::fallback` and not registered redirect routes (`Route::permanentRedirect`, a `{any}` catch-all): `fallback` runs **only when nothing else matched**, so the real `/empresa`, `/seguros`, `/seguros/{slug}`, `/api/*` always win and keep their `200` — the redirect layer is safe by construction. Registered redirects run *before* real routes and force you to hand-prove no legacy pattern overlaps a live one, an invariant that silently breaks when a future route is added.

### 5. Verify — HTTP script against the running site (the acceptance bar)
The site runs in Docker; there is no local PHP/`vendor` to run PHPUnit against. Prove it with HTTP, driven by step 1's discovered list:

```bash
BASE=http://localhost:8080     # localhost pre-cutover; re-run with the real domain at go-live
chk() { c=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$1"); l=$(curl -s -o /dev/null -w "%{redirect_url}" "$BASE$1");
        printf "%-42s %s %s\n" "$1" "$c" "$l"; }
chk /a-empresa                       # expect 301 -> /empresa
chk /seguros/seguro-moto/371624      # expect 301 -> /seguros/moto
chk /noticias/algum-artigo/123       # expect 301 -> /  (or 410, per the group decision)
chk /empresa                         # expect 200  (real page not shadowed)
chk /seguros/moto                    # expect 200  (redirect TARGET actually resolves)
chk /pagina-que-nunca-existiu        # expect 404
```

Assert: **every discovered old URL** 301s (not 302) to the right target; **each target itself returns 200** (a `/seguros/{slug}` whose slug doesn't exist still returns the SPA shell with 200 — curl the target and grep its `<title>` to confirm it's the real ramo, not the "não encontrado" shell); single hop, no `301→301` chains; real pages stay 200; a garbage URL stays 404. **Re-run against the real domain at go-live** — CDN/DNS can differ from localhost. Record the go-live-only follow-ups (sitemap→GSC, www canonical, real privacy page) as a checklist, not code.

## Common Mistakes

| Footgun | Reality |
|---|---|
| Trusting the old `/sitemap.xml` | Page-builder sitemaps often return the home HTML at 200, not real `<urlset>` XML. Open it and check before relying on it; lean on GSC + a crawl. |
| Inferring old slugs/ids to save a crawl | A guessed `seguro-auto→auto` ships a wrong 301 that passes every smoke check. Discovery **precedes** mapping; the pattern table comes from GSC/crawl. |
| `redirect($to)` for the redirect | Defaults to **302**. SEO equity only transfers on a **301** — pass it explicitly. |
| Registered redirect routes before the pages loop | They run before real routes and can shadow a live page; you must hand-prove non-overlap. Use `Route::fallback` **last** — safe by construction. |
| `Route::fallback` placed before `require api.php` | It would swallow `/api/*` and real routes. It must be the **last** thing registered. |
| Many retired URLs → `301` home, silently | Google flags many-to-one→home as soft-404. Surface 301-vs-410 and let the human decide per group. |
| Redirect target that 404s or itself redirects | Assert each target returns a genuine 200 (right `<title>`), single hop. A 301 into a 404 is worse than the original 404. |
| Auto-mapping by slug similarity | `/beneficios`→`/empresa`, `/trabalhe-conosco`→`/contato` are editorial. Propose the map; get human approval. |

## Real-World Impact

Given a clean nimbou site and this exact scenario, a capable agent without this skill trusted the old sitemap, **fabricated the four ramo slug mappings** (all wrong) and shipped them, built six files with a middleware and a shadowing-prone registered-route layer, and wrote a test suite it then **couldn't run**. This skill delivers the two-file `Route::fallback` idiom, the discovery-before-mapping discipline, and the HTTP acceptance bar directly.
