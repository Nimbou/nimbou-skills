---
name: browser-smoke
description: Use when the user requests browser verification of a web page or flow, or when executing-plans calls for a frontend smoke.
---

# Browser Smoke

This skill opens a real browser to check whether a requested page or user flow
works on screen. It can verify a local change, an existing application, or a
deployed version.

It is a **smoke pass, not a test suite**: it checks a small set of visible
behaviors and collects evidence. Persistent E2E coverage is
`nimbou-skills:nuxt-test`; investigating a known bug is `nimbou-skills:nuxt-debug`.

## When to run

Run when the user directly asks for browser verification, invokes this skill, or
`nimbou-skills:executing-plans` calls it after frontend work. No `nuxt-plan`,
changed frontend file, or local checkout is required for a direct request.
Follow the user's target URL, environment, browser preference, flows, and scope.
Do not treat this skill as authorization for unrelated changes. In a live
environment, perform state-changing actions only when they are part of the
requested flow; avoid altering unrelated records.

**Announce at start:** "Estou usando a skill browser-smoke para verificar o fluxo no navegador."

## Modes

| Mode | Who calls it | What it does with findings |
|---|---|---|
| `report` | A direct smoke request or `nimbou-skills:executing-plans` | Reports evidence and findings without editing code. |
| `fix` | A request that also asks to fix failures | Fixes failures in the owning code, re-runs affected flows once, and commits only when requested or required by the caller. |

Use the caller's mode when supplied. Otherwise default to `report`; a request
to fix or correct defects selects `fix`.

## Step 1: Identify the target

For a direct request, use the URL, page, environment, and behavior the user
named. If some detail is missing, infer it from the current task or application
before asking. A request can target production, staging, a local server, or a
flow with no code change.

When called by `executing-plans`, use the changed-file list (`git diff --name-only
<base>..HEAD`, or the caller's list) to confirm a frontend surface changed:

```
*.vue   pages/   components/   layouts/   composables/   middleware/
app.vue   nuxt.config.*   assets/   *.css   *.scss
```

No match in an `executing-plans` run means no frontend surface changed. Say so
in one line and stop. This file check does not apply to direct requests.

A fullstack change matches on its frontend half. The backend half is still in scope
for the flows, because a page that renders is not the same as a page whose API call
succeeded.

## Step 2: Pick a driver, or stop cleanly

Honor a browser or driver explicitly chosen by the user when it can perform the
flow. Otherwise try these available drivers in order:

1. **agent-browser** — preferred for repeatable smoke flows. Before its first
   use, read `agent-browser skills get core`. Create a task-specific named
   session and pass `--session` on every command. Navigate, take a snapshot,
   act on current refs, and snapshot again after page changes. Collect a
   screenshot, console errors/warnings, and failed network requests for each
   flow. Keep authentication in that session; never print, save, or report
   passwords, tokens, cookies, or other secret values.
2. **Codex integrated browser** — use its navigation, interaction, screenshot,
   console, and network capabilities.
3. **Chrome DevTools MCP** — use its snapshot, console, network, and script
   evaluation tools.
4. **Playwright MCP** — use an already available session as the final fallback.
5. **Nothing.** Then **skip the smoke and say so loudly**: record
   `front alterado, validação em browser não executada: nenhum driver de browser disponível`
   (or equivalent wording for the requested target) as a concern and exit.
   Do not install a browser toolchain solely for this smoke or report an
   unexecuted flow as verified.

If a driver fails to launch or attach, try the next available driver and report
the failure as a concern only if it prevents the requested verification. An
agent-browser session may have a different login state from the user's Chrome;
complete the requested login when possible or report the blocked flow.

A session without an allowed driver gets an honest gap, not a fabricated pass. The
gap is worth more than the pass would be: "not run" is actionable, "passed" would be
a lie.

## Step 3: Reach the application

For a local target that is not already running, discover how to start it using
`./reference/environment-discovery.md`. Use the checkout under verification;
when the caller supplies `WORKTREE_ROOT`, start from there. For an existing
local, staging, or production URL, navigate to it directly. Do not start a
local server for a remote target.

If you started a local server, run it in the background with a bounded wait.
If it never answers, report an environment concern.

## Step 4: Health check before any flow

For a changed local application, navigate to one route the change did not
touch and confirm it renders without fatal console errors. For a direct
request without a code diff, check that the target application responds and
that a stable page or entry route renders before testing the requested flow.

This separates an unusable environment from a failed flow. A dev server that
never started, a missing `.env`, or an unavailable remote application cannot
prove whether the requested behavior works.

So:

- **Health route fails** → the environment is not usable. Record
  `ambiente indisponível: <what you observed>` as a concern, **skip every flow**, and
  report zero findings. Never a defect, never a fix cycle.
- **Health route renders** → proceed with the requested flows and report their
  observed result without assuming the cause of a failure.

Say which route you used for the health check. If authentication blocks access
to the requested flow, report it as an environment concern and do not claim
the flow passed.

## Step 5: Derive the flows from what was promised

Use the user's requested checks, or derive the **user-visible behavior**
promised by the plan or change description. Each flow is an action and its
observable result:

> "Anexar um arquivo a uma proposta e ver o thumbnail no card."
> "Filtrar projetos por status e ver a lista reduzir."

Execute each requested flow in the browser: navigate, interact, observe.

For a plan-driven smoke, derive flows from the plan's promise rather than
merely opening changed files. For a direct request, verify the flows the user
named without imposing a plan.

Rules:

- Keep a smoke small by default, usually three to six flows. If the user names
  a different set, follow that scope and report any flows not reached.
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

Reference screenshots **by path**. For a live system, omit secret values and
personal data from reports and screenshots when they are not needed to prove
the result.

## Step 7: Report

```
**Driver:** agent-browser | codex-integrated | chrome-devtools MCP | playwright MCP | none (skipped)
**Ambiente:** target URL or startup method, and the health route you checked
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

In `fix` mode, continue: fix the failures at the owning layer and re-run **only
the failing flows** once. Commit when the user or caller requested it. Two
consecutive failures on the same flow mean the diagnosis needs revision;
stop and report it instead of trying a third guess.

## When to Stop

Stop and report instead of pushing through when:

- no browser driver is available (Step 2)
- the health route does not render (Step 4)
- a flow needs a session or data you cannot obtain
- the same flow fails twice after a fix in `fix` mode

## Boundary

| Skill | Use it when |
|---|---|
| `browser-smoke` | the user requests browser verification of any web flow, or `executing-plans` reaches its final frontend smoke step |
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
