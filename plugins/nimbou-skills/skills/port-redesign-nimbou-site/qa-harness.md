# port-redesign — QA harness & templates

Companion to `port-redesign-nimbou-site`. The **screenshot is blank** in a non-compositing browser pane, so the rendered DOM — measured by JS — is the source of truth. Run every block in the browser console (or via the browser MCP `javascript`/`evaluate` tool) against the running site. Nothing here proves fidelity by looking; it proves it by measuring.

---

## 1. Force the viewport, THEN navigate/measure

`resize_window` alone may not change the **render** viewport in a non-compositing pane (`innerWidth` stays 0 / stale), and lazy content never intersects. Force the size, fire `resize`, reload if the page gates layout on load, and assert the width you think you have **before** measuring.

```js
// run BEFORE navigating, or before each measurement pass
function forceViewport(w, h) {
  try { window.resizeTo(w, h); } catch (e) {}
  Object.defineProperty(window, 'innerWidth',  { configurable: true, value: w });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: h });
  window.dispatchEvent(new Event('resize'));
  return { innerWidth: window.innerWidth, docClientWidth: document.documentElement.clientWidth };
}
forceViewport(1280, 800);   // desktop pass
// forceViewport(375, 812); // mobile pass
```

If the pane refuses to change `document.documentElement.clientWidth`, measure geometry against a **known width** you pass in explicitly rather than trusting `innerWidth`, and record which width each assertion used. Never report a mobile result you could not confirm the viewport for — say "unverified", don't guess.

---

## 2. Images — validate by HTTP + `naturalWidth`, never by eye

An `<img>` that decoded has `complete === true` **and** `naturalWidth > 0`. A broken/never-loaded one has `naturalWidth === 0`. This is why content images are plain `<img>` (not `v-img`): the lazy `IntersectionObserver` never fires without compositing, so a `v-img` would report `naturalWidth 0` forever and read as "broken" when the URL is fine.

```js
// DOM audit — after forcing viewport and scrolling the page once
[...document.querySelectorAll('img')].map(el => ({
  src: el.currentSrc || el.src,
  lazy: el.loading,
  complete: el.complete,
  naturalW: el.naturalWidth,           // 0 = broken OR lazy-never-fired
  renderedW: Math.round(el.getBoundingClientRect().width),
})).filter(i => i.naturalW === 0);      // assert: empty
```

If any come back `naturalW 0`, **confirm the URL is actually good** before blaming the port — a valid CMS URL behind a lazy loader is a false negative:

```js
// HTTP + decode proof, independent of the lazy loader / compositing
async function proveImage(url) {
  const r = await fetch(url, { method: 'GET' });                 // expect 200, image/*
  const okHttp = r.ok && (r.headers.get('content-type')||'').startsWith('image');
  const im = new Image(); im.src = url;
  const okDecode = await im.decode().then(() => im.naturalWidth > 0).catch(() => false);
  return { url, status: r.status, okHttp, okDecode, naturalW: im.naturalWidth };
}
// await Promise.all(cmsImageUrls.map(proveImage));  // every one { okHttp:true, okDecode:true }
```

Rule: a content image passes only when its URL is **HTTP 200 image/\*** and `new Image()` decodes to `naturalWidth > 0`. CSS `background-image` art can't be proven by `naturalWidth` — `fetch(url)` it (200) and confirm the element has a non-zero box.

---

## 3. Sticky header — prove it pins, and find what breaks it

`position:sticky` silently dies if any ancestor has non-`visible` overflow or a `transform`/`filter` (it also dies if the nearest scroll container is a short wrapper instead of the page). Keep the redesign's own `position:sticky` and make the ancestor chain transparent with `display:contents` — do **not** swap in `v-app-bar`/`position:fixed` (that changes the layout and the fidelity).

```js
const h = document.querySelector('header, [class*="header"]');
// (a) it must actually be sticky/fixed
const cs = getComputedStyle(h); ({ position: cs.position, top: cs.top, z: cs.zIndex });
// (b) no ancestor breaks sticky
let n = h.parentElement, blockers = [];
while (n && n !== document.body) { const s = getComputedStyle(n);
  if (s.overflowY !== 'visible' || s.transform !== 'none' || s.filter !== 'none')
    blockers.push({ tag: n.tagName, cls: n.className, overflowY: s.overflowY, transform: s.transform });
  n = n.parentElement; }
blockers;                                   // assert: empty
// (c) behavioural proof — header top unchanged after a big scroll, hero moved
const hBefore = h.getBoundingClientRect().top;
const hero = document.querySelector('.hero, [class*="hero"]'); const heroBefore = hero?.getBoundingClientRect().top;
window.scrollTo(0, 1200); await new Promise(r => setTimeout(r, 250));
({ pinned: Math.abs(h.getBoundingClientRect().top - (parseInt(cs.top)||0)) < 2,
   heroMoved: hero ? heroBefore - hero.getBoundingClientRect().top > 400 : null,
   scrolled: window.scrollY });            // assert: pinned true, heroMoved true, scrolled large
```

If `blockers` is non-empty, add `display:contents` to those wrappers (or lift the header out of them) until the block-parent of the sticky element is the page (`v-application__wrap`), then re-run.

---

## 4. No horizontal overflow — name the culprit

```js
const de = document.documentElement, vw = de.clientWidth;
({ overflow: de.scrollWidth > vw + 1,
   culprits: [...document.querySelectorAll('*')]
     .filter(el => el.getBoundingClientRect().right > vw + 1)
     .map(el => ({ tag: el.tagName, cls: el.className, right: Math.round(el.getBoundingClientRect().right) }))
     .slice(0, 15) });                     // assert overflow:false at BOTH 1280 and 375
```

Run at 375 especially — an unwrapped grid, a fixed-width image, or a `100vw` block is the usual offender. The `culprits` list names the exact node.

---

## 5. Sections present, in order + console clean

```js
const expected = ['header','hero','seguros','empresa','equipe','premios','contato','footer']; // from the export
const found = expected.map(id => { const el = document.querySelector(`#${id},[data-section="${id}"],.${id}`);
  const r = el?.getBoundingClientRect(); return { id, present: !!el, top: r ? Math.round(r.top+scrollY) : null, h: r ? Math.round(r.height) : null }; });
({ missing: found.filter(s=>!s.present).map(s=>s.id),        // assert empty
   zeroHeight: found.filter(s=>s.present && !s.h).map(s=>s.id), // assert empty (a section rendered but collapsed)
   orderOk: found.filter(s=>s.present).every((s,i,a)=> i===0 || s.top >= a[i-1].top) });
```

Read console messages → assert **zero** errors (hydration warnings, 404/mixed-content on CMS images, unhandled fetch rejections). An empty SPA shell renders correct spacing with no content — confirm the CMS fetch returned a **non-empty** payload (network `GET /api/{module}` 200 with rows), or you can pass every geometry check on an empty page.

---

## 6. Fidelity checklist (the acceptance gate)

Fill one per page. All rows must pass at **1280 and 375** before the page is "done". Automated rows are measured by §1–5; the last row is a **human sign-off** — the harness proves the page is not broken, a person confirms it looks like the redesign.

```md
### Fidelity — <page> (build <entry hash>)
| Check | 1280 | 375 | Evidence |
|---|---|---|---|
| Sections present + order (§5) | ☐ | ☐ | missing:[] zeroHeight:[] orderOk:true |
| Content images HTTP200 + naturalWidth>0 (§2) | ☐ | ☐ | N/N ok |
| No horizontal overflow (§4) | ☐ | ☐ | scrollWidth<=clientWidth |
| Sticky header pinned, no blockers (§3) | ☐ | ☐ | pinned:true blockers:[] |
| CMS payload non-empty (§5) | ☐ | ☐ | /api/{module} 200, rows>0 |
| Console clean (§5) | ☐ | ☐ | 0 errors |
| Brand tokens/typography match export | ☐ | ☐ | primary/accent/serif per redesign |
| **Human sign-off vs redesign** | ☐ | ☐ | reviewer + date |
```

---

## 7. Port manifest (the tracing/versioning artifact)

Write `docs/<phase>/port-manifest.md` so a second port can diff against it. It maps every export block to the component and CMS source it became, and pins the export hash it was ported from.

```md
# Port manifest — <phase> (export <sha256 of the .dc.html>)
| Export block (selector/section) | Component | CMS source | Reusable? | Notes |
|---|---|---|---|---|
| header.site-hd | components/App/Header/Desktop.vue | /api/informations (logo, whatsapp) | shared | display:contents on 2 wrappers |
| section.hero | components/Section/Home/HomeHero.vue | static art + informations | catalog:PageHero | bg via <img> layer |
| #seguros .seg-grid | components/Section/Home/HomeSeguros.vue | /api/ramos | catalog:CardGrid | category derived from slug |
| script.__DC.quoteModal | components/QuoteModal.vue + composables/useQuote.ts | informations.whatsapp | shared | data→CMS; interaction re-derived |

## CMS gaps (delegated, not built here)
- <content in the redesign with no module> → hand off to laravel-think/execute + nimbou-cms-wire
```

**Re-run (second port, updated export):** hash the new export; `diff` its section inventory against the manifest; produce an **impact report** (added/changed/removed blocks) and apply **surgical edits** to the mapped components only. Never blind-overwrite a component file — hand edits from later phases live there.
