---
name: browser-smoke
description: Use after a change that touched frontend files to verify in a real browser that the promised behavior actually works — derive the flows from the plan or change description, drive them with Chrome DevTools MCP, and report screenshot plus console evidence per flow. Runs as the last step of executing-plans, or standalone over any branch.
---

# Browser Smoke

Every other lens in this repository reads code. Tests, spec review, and the boundary
analyzer all pass on a change whose page renders blank. This skill is the one that
opens the application and looks.

It is a **smoke pass, not a test suite**: it verifies the behavior the change
promised, on the screen, and writes nothing permanent. Persistent E2E coverage is
`nimbou-skills:nuxt-test`; investigating a known bug is `nimbou-skills:nuxt-debug`.

**Announce at start:** "I'm using the browser-smoke skill to verify this in a browser."

## Modes

| Mode | Who calls it | What it does with findings |
|---|---|---|
| `report` | `nimbou-skills:executing-plans` (its Step 5) | Reports only. The caller owns the fix cycle and the commits. |
| `fix` | you, invoking the skill directly | Fixes what it found, re-runs the failing flows once, commits. |

Default to `report` when a caller declared a mode. Default to `fix` when a human
invoked the skill with no mode — a standalone run that only complains is useless.

## Step 1: Does this apply?

Run the smoke only when the change touched the frontend. Take the list of changed
files (`git diff --name-only <base>..HEAD`, or the file list the caller handed you)
and look for any of:

```
*.vue   pages/   components/   layouts/   composables/   middleware/
app.vue   nuxt.config.*   assets/   *.css   *.scss
```

No match means no frontend surface changed. Say so in one line and stop — do not
smoke a backend-only change to be thorough.

A fullstack change matches on its frontend half. The backend half is still in scope
for the flows, because a page that renders is not the same as a page whose API call
succeeded.

## Step 2: Pick a driver, or stop cleanly

In order:

1. **Chrome DevTools MCP** — the primary path. Same tools `nimbou-skills:nuxt-debug`
   uses: snapshot, console messages, network requests, evaluate script. The server
   name is project-configured; look for tools matching `mcp__chrome*devtools__*`.
2. **Playwright MCP**, when it is connected and DevTools MCP is not.
3. **Nothing.** Then **skip the smoke and say so loudly**: record
   `front alterado, validação em browser não executada: nenhum driver de browser disponível`
   as a concern, surface it in the report, and exit. Do not install a browser
   toolchain, do not write a throwaway Playwright script, and above all do not
   report the change as verified.

The driver belongs to the project, not to this skill. A project without one gets an
honest gap, not a fabricated pass. The gap is worth more than the pass would be:
"not run" is actionable, "passed" would be a lie.

## Step 3: Bring the application up

Discover how, per `./reference/environment-discovery.md`. Everything happens inside
the checkout under verification — when a caller handed you a `WORKTREE_ROOT`, that is
where the dev server runs, because a server started in another checkout serves code
this change does not contain.

Start it in the background, and give it a bounded wait. If it never answers, that is
Step 4's problem, not a defect.

## Step 4: Health check before any flow

**Navigate to one route the change did NOT touch.** Confirm it renders and the
console is free of fatal errors.

This single navigation is the difference between a useful smoke and a harmful one. A
dev server that never started, a missing `.env`, an unmigrated database, or a port
already in use all produce broken pages that look exactly like a broken feature. If
that reaches the caller as a finding, the fix cycle spends a full round correcting
code that was always correct.

So:

- **Health route fails** → the environment is not usable. Record
  `ambiente não subiu: <what you observed>` as a concern, **skip every flow**, and
  report zero findings. Never a defect, never a fix cycle.
- **Health route renders** → the environment is good. From here on, a broken page is
  the change's fault, and you can say so with confidence.

Pick the health route from the project's existing pages — a login screen, a home
route, any page whose files are absent from the change's file list. Say which route
you picked and why in the report.

## Step 5: Derive the flows from what was promised

Read the plan (or, standalone, the change description and the diff) and extract the
**user-visible behavior it claims to deliver**. Each flow is a sentence in the shape
of an action and its observable result:

> "Anexar um arquivo a uma proposta e ver o thumbnail no card."
> "Filtrar projetos por status e ver a lista reduzir."

Then execute each one in the browser: navigate, interact, observe.

Deriving flows from the plan's prose rather than from the file list is the whole
point. Opening the route that imports a changed component proves the route still
renders; it does not prove the feature works. The promise is what nobody verified
yet — the tests asserted slices of it, in isolation, and the reviewers read the code
that implements it.

Rules:

- **Three to six flows.** More than that is a test suite, and this is not one. When
  the change promises more, take the ones a user would hit first.
- **Authentication is part of the flow, not a prerequisite to skip.** When a flow
  needs a session and you cannot obtain one, that is an environment concern under
  Step 4's rule, not a finding.
- **Do not fix anything while smoking**, even in `fix` mode. Observe every flow
  first; a fix applied mid-pass invalidates the flows that come after it.

## Step 6: Evidence, not assertions

For each flow, capture and report:

- a **screenshot**, saved to the scratchpad directory, referenced by path
- the **console output** during the flow — errors and warnings, not the full log
- the **failed network requests**, when any
- the route you ended on

A claim that a flow worked is not evidence that it ran. This is the same rule the
`RED` run follows in `nimbou-skills:executing-plans`, for the same reason: a report
is the only artifact that distinguishes a smoke that happened from one that did not.

Reference screenshots **by path**. Do not describe what each image shows beyond one
line — a paragraph per screenshot costs more than the smoke itself.

## Step 7: Report

```
**Driver:** chrome-devtools MCP | playwright MCP | none (skipped)
**Ambiente:** how it was started, and the health route you checked
**Fluxos verificados:** N

Per flow:
  - **<flow sentence>** — PASS | FAIL
    Rota final, screenshot: <path>
    Console: <errors, or "limpo">
    On FAIL: what you saw versus what the change promised, in one or two lines.

**Concerns:** environment gaps, flows you could not reach, driver absent.
```

In `report` mode, stop here. Every `FAIL` is a finding the caller will route into its
fix cycle; every concern is a concern. Do not edit files.

In `fix` mode, continue: fix the failures at the owning layer, re-run **only the
failing flows** once, and commit. Two consecutive failures on the same flow means the
diagnosis is wrong — stop and report it rather than trying a third guess.

## When to Stop

Stop and report instead of pushing through when:

- no browser driver is available (Step 2)
- the health route does not render (Step 4)
- a flow needs a session or data you cannot obtain
- the same flow fails twice after a fix in `fix` mode

## Boundary

| Skill | Use it when |
|---|---|
| `browser-smoke` | verifying that a change's promised behavior works on screen, once, right after building it |
| `nimbou-skills:nuxt-debug` | investigating a known browser bug, with live evidence before any fix |
| `nimbou-skills:nuxt-test` | building or stabilizing persistent Playwright coverage |
| `nimbou-skills:e2e-test-quality` | auditing an existing E2E suite for a bounded flow |

This skill writes no tests. If a flow it verified deserves permanent coverage, that
is a follow-up for `nuxt-test`, and it should be recorded as one.

## Integration

- `nimbou-skills:executing-plans` — calls this in `report` mode as its Step 5, after
  the follow-up commits, when the executed plan touched frontend files
- `./reference/environment-discovery.md` — how to bring the app up without a
  per-project contract
