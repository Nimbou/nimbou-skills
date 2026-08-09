# nuxt-debug — fluxo obrigatório

Corpo executável de `nuxt-debug`. Leia antes de tocar em qualquer arquivo de frontend.

## Mandatory Flow

### Phase 1: Reproduce in the Browser

1. Reproduce with exact route, viewport, auth state, and seed data.
2. Capture what the user actually sees:
   - rendered text and controls
   - console output
   - network requests
   - route and query params
   - DOM state before and after the interaction
3. Separate first-load, client navigation, and refresh behavior.
   - SSR-only failures and client-only failures usually have different causes.
4. Do a short QA inventory before touching code:
   - what user-visible claim is broken
   - what controls and text prove the claim
   - what loading, empty, error, and success states matter
   - whether the claim is functional, visual, or both

Do not inspect transient DOM details before the page reaches a stable observable state.

### Phase 2: Locate the Owning Boundary

Trace the failure through the frontend path:

```text
Route -> page/layout -> composable/store -> component -> network call -> rendered state
```

Determine where the contract first breaks:
- wrong route params or query parsing
- missing fetch trigger or stale watch dependency
- store mutation not reflected in UI
- Vuetify component not receiving expected props
- backend response is correct, but frontend mapping is wrong
- browser request is wrong before it ever reaches the backend

Do not treat a browser symptom as proof that the backend is wrong.

### Phase 3: Compare With a Working Path

Find the nearest working example in the same Nuxt codebase:
- same page pattern
- same composable or store pattern
- same form submission flow
- same table/filter/pagination behavior
- same Playwright selector style

Compare:
- `useAsyncData` or fetch lifecycle
- watchers and computed dependencies
- route sync and navigation timing
- prop flow into Vuetify components
- loading, empty, and error states
- selector stability and waiting strategy in tests

If the route was recently edited, compare the changed path against a full page reload. If unrelated shared code changed, prefer a clean browser relaunch before trusting cached state.

### Phase 4: Form One Hypothesis

State it explicitly:

```text
I think X is the root cause because Y.
```

Then test only that hypothesis.

Examples:
- "Hydration mismatch starts because the page reads `window` during SSR."
- "The table never refreshes because the watch source omits `page`."
- "The Playwright failure is test-side because the selector depends on transient Vuetify markup."

### Phase 5: Fix and Verify

1. Add or update the narrowest failing check first only when a regression needs proof.
   - Playwright for user-visible regressions
   - component or composable tests when the failure is local and already supported

   Use `nimbou-skills:nuxt-test` when you need to expand or stabilize Playwright coverage.

2. Apply one fix at the owning layer.
   - route/composable for state-sync bugs
   - page/component for rendering bugs
   - test selectors/waits for test-only failures

3. Verify with the same live evidence used during investigation.
   - rerun the browser path
   - recheck console and network
   - rerun the relevant scripted coverage only if the bug depended on it
4. End with a short QA pass:
   - re-check the original user-visible claim
   - verify one adjacent state that could regress
   - if the claim is visual, confirm layout and emphasis at the affected viewport
   - if the claim is functional only, do not inflate the pass into a full visual review

5. If the fix fails, stop and reopen the investigation.
   - After 2 failed fixes, your ownership assumption is probably wrong.
   - After 3 failed fixes, question the frontend boundary or data-flow design.
