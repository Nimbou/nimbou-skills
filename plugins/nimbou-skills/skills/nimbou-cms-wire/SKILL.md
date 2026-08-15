---
name: nimbou-cms-wire
description: Use when a nimbou-cms module already exists and its /api/{key} responds, but the Nuxt SPA still needs to consume it — wiring the entity, store, model, mock and composable for a module (Table or Item) on the nimbou-site @ministerjs stack. The frontend counterpart of laravel-execute. NOT for building the CMS module/API (that's laravel-execute) and NOT the page/component design (that's nuxt-think/nuxt-plan).
---

# nimbou-cms-wire (nuxt)

## Overview

The **frontend counterpart of `laravel-execute`**. Once a nimbou-cms module is built and `GET /api/{key}` responds, the Nuxt SPA still has to be fiado to consume it: the typed entity, the `@ministerjs` store/model registration, the dev mock, and the composable that owns the fetch. This skill does exactly that wiring — for a Table (list) or Item (singleton) module — and stops at the composable, handing the UI off to `nuxt-think`/`nuxt-plan`.

**Core principle — the API response is NOT the view-model.** `GET /api/{key}` returns **raw** data: a Table comes `created_at DESC`; `collectionWithKey` comes back as a **JSON string**; `imageFile` as `{featured,list}`; `category`/`tags` as raw ids with **no labels**. The **composable is the single normalization boundary** (sort, `JSON.parse`, reshape, resolve-by-slug) and the **mock mirrors the raw API shapes** so dev-with-mocks exercises the *same* parse/sort path that production hits. Confirm the shapes with one `GET /api/{key}` — never guess, never reverse-engineer the PHP.

**Announce at start:** "I'm using the nimbou-cms-wire skill to wire this module into the SPA."

## When to Use

- After `laravel-execute` (or equivalent) has built the module and `/api/{key}` returns data.
- You have the contract: the module `key`, its **view type** (Table/Item), and the field list with types.
- **Not** to build the CMS module or API (that's `laravel-execute`).
- **Not** to design the page/component or its look (that's `nuxt-think`/`nuxt-plan` — this skill hands off at the composable).

## Boundary

- **In scope:** `entities/<Name>.ts` (+ `entities/index.ts`), the `stores.ts` + `models/modelSetups.ts` registration, `mocks/mockData.ts`, and `composables/use<Name>.ts` (the fetch owner). All under `resources/nuxt/`.
- **Out of scope:** the consuming page/component and its design (hand to `nuxt-plan`); any CMS/backend change; `config/pages.php` routing/SEO (that's `laravel-execute`, when the content has a public URL).
- **`config/resources.ts` is generic** (`useRestResources(fetch_)` derives `/api/{key}` from the store key) — **do not edit it** for a standard REST key.

## Procedure

### 1. Read the contract from one live call
`curl -s $API/api/<key> | jq '.data'` (or `.data[0]` for a Table). Match each field against the **duty table** below and note what each needs. This one call resolves every "is it a string or an array?" doubt — cheaper and more reliable than reading the admin PHP.

### 2. The entity — raw shape + view shape
`entities/<Name>.ts`: an interface for the **raw** row (exactly as the API returns it — e.g. `coberturas: string`, `category: number | null`) and, when normalization changes types, a `<Name>View` (`Omit<...>` the raw field, add the parsed one). Add `export * from "./<Name>"` to `entities/index.ts`.

### 3. Register the store + model (both files, same key)
- `config/stores.ts`: **Table** → `new VueTableStore<X>({ primaryKey: "id" })`; **Item** → `new VueItemStore<X>()`.
- `config/models/modelSetups.ts`: **Table** → `new TableModel<X>({ resource: provider.get("<key>"), store: stores.get("<key>") })`; **Item** → `new ItemModel<X>({...})`.

Import the entity type in both. The `models`/`resources` proxies pick up the new key automatically — nothing else to register.

### 4. The mock — mirror the RAW shapes (mandatory)
`config/mocks/mockData.ts`: add a fixture and register it — **Table** → `<key>: { type: "table", data: [...] }`; **Item** → `<key>: { type: "item", data: {...} }`. The fixture MUST use the same raw shapes the API returns: `collectionWithKey` as `JSON.stringify([[a,b],...])` (a **string**), `imageFile` as `{ featured, list }`, `category`/`tags` as raw ids. A pre-parsed "convenient" mock makes dev pass and prod break — the whole point is that mocks exercise the real normalization path. (Missing entry → runtime `No mock resource registered for key "<key>"`.)

### 5. The composable — the single normalization boundary
`composables/use<Name>.ts` owns the fetch and every client-side duty the API doesn't do:
- **Table:** `const m = models.get("<key>") as TableModel<X>; const { loading, execute } = useLoading(() => m.list());` then a `computed` over `stores.get("<key>").items.value` that **`.slice().sort((a,b)=>(a.sort_order??0)-(b.sort_order??0))`** and maps raw→view (`JSON.parse` etc.). Add `findBySlug`/`others` when the module has a detail page.
- **Item:** `const m = models.get("<key>") as ItemModel<X>; useLoading(() => m.get());` then a `computed` over `stores.get("<key>").get().value` (no sort).

Mirror an existing composable (`useRamos` for Table, the `informations` path for Item); reuse the existing parse helper (`utils/ramo.ts` `parsePairs`) rather than reinventing it.

### 6. Verify — real fetch, mocks OFF, async-aware
Dev (`NUXT_PUBLIC_USE_MOCKS=true`) proves the UI renders from the fixture. Then prove it against the real API: set `NUXT_PUBLIC_USE_MOCKS=false` (or `NUXT_PUBLIC_USE_MOCKS_EXCEPT=<key>` to keep the rest mocked), **rebuild before shipping** (`pnpm generate`), navigate, and confirm CMS data in the DOM + a clean console. The fetch is **async** and `v-img` is **lazy** — checking the DOM immediately after navigation shows an empty section (false negative); wait a few seconds for hydration. Hand larger flows to `nimbou-skills:browser-smoke`.

## Field type → frontend duty

Confirm against step 1's `GET`; this is the prior.

| Field type | `/api/{key}` returns | Duty in the composable/template |
|---|---|---|
| `tinyText`/`mediumText` | `string` | render as-is |
| `bigText` | `string` (often HTML) | `v-html` **only** if authored as trusted HTML |
| `number`/`price` | `number` | as-is |
| `switchBoolean` | `0`/`1` | coerce to boolean |
| `date`/`datetime` | `string` | format |
| `imageFile` | **`{ featured, list }`** (paths absolute) | read `image.featured?.path`; never bind the object |
| `file` | **single absolute URL `string`** or `null` | use as `href` (download); **NOT** a MediaGroup |
| `category`/`subcategory` | **raw id** (`number\|null`), **no label** | wire the taxonomy module too (its own `/api/{tax}` — entity/store/model/mock/composable) and resolve id→label from its store; never hardcode an id→label map. Render nothing if unresolved |
| `tags` | JSON of ids (**confirm array vs string** in step 1) | parse if string, then resolve ids→labels |
| `collection` | JSON array | use (confirm shape) |
| `collectionWithKey` | **JSON string** of `[[a,b],...]` | **`JSON.parse`** then map to `{a,b}` — this one is always a string |
| — Table ordering — | rows `created_at DESC` | **sort by `sort_order`** client-side |

## Item vs Table

| | Table (list) | Item (singleton) |
|---|---|---|
| Store | `VueTableStore<X>({ primaryKey: "id" })` | `VueItemStore<X>()` |
| Model | `TableModel<X>` | `ItemModel<X>` |
| Fetch | `model.list()` | `model.get()` |
| Read | `store.get("<key>").items.value` | `store.get("<key>").get().value` |
| Sort | yes (`sort_order`) | n/a |
| Mock | `{ type: "table", data: [...] }` | `{ type: "item", data: {...} }` |
| Example to mirror | `ramos`/`premios`/`equipe` | `informations` |

## Common Mistakes

| Footgun | Reality |
|---|---|
| Binding an `imageFile` value directly | It's `{featured,list}` → renders `[object Object]`. Use `image.featured?.path`. |
| Treating `file` like `imageFile` | `file` is a **bare URL string** (or null), not a MediaGroup. Use it as an `href`. |
| Rendering `category`/`tags` raw | They're **ids, not labels** → you'd show `1` or `"[1,3]"`. Resolve via a linked taxonomy module wired the same way. |
| Hardcoding an id→label map for `category`/`tags` | The ids come from the CMS and drift as options change — a static map rots silently. Wire the taxonomy module and resolve from its store (the CMS stays the source of truth). |
| Not parsing `collectionWithKey` | The API returns it as a **JSON string**, not an array. `JSON.parse` it in the composable. |
| Trusting the API's order | A Table comes back `created_at DESC`. Sort by `sort_order` client-side. |
| A "convenient" pre-parsed mock | Dev passes, prod breaks. The mock MUST mirror the raw API (string for collectionWithKey, `{featured,list}`, raw ids). |
| Forgetting a registration point | Miss one of entity(+index)/store/model/mock/composable → `No mock resource registered` or an undefined model at runtime. |
| Editing `config/resources.ts` | It's generic (`useRestResources`) — a standard REST key needs no change there. |
| Shipping the prod build with mocks ON | The SPA serves fixtures. Set `NUXT_PUBLIC_USE_MOCKS=false` **before** `pnpm generate`. |
| Checking the DOM right after navigating | The fetch is async and `v-img` is lazy — you'll see an empty section. Wait for hydration before judging. |

## Real-World Impact

Given this exact task (a built module + live API), two capable agents without this skill reconstructed the wiring only by **reverse-engineering the field contracts from the admin/CMS PHP source** — ~83k tokens/16 tool calls (Item) and ~114k tokens/22 tool calls (Table) — and one still **hedged on whether `collectionWithKey` is a string**. A less diligent agent binds `category` ids and the raw `tags` string straight into the template. This skill delivers the verified type→duty contract, the normalization-in-the-composable boundary, and the mocks-off acceptance check directly.
