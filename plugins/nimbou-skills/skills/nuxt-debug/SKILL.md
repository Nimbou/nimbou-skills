---
name: nuxt-debug
description: Use for Nuxt/Vuetify browser bugs, hydration issues, or flaky frontend behavior before proposing fixes. Prefer Chrome DevTools MCP evidence first and use Playwright only when scripted reproduction is required.
---

# Nuxt Systematic Debugging

Use this skill when the bug is clearly frontend-first: route rendering, hydration, browser state, network sequencing, Vuetify interaction, or flaky browser behavior around a Nuxt app.

If the failure is primarily in NestJS, Prisma, or backend contracts, use `nestjs-debug` instead.

## Core Rule

```text
NO FRONTEND FIXES BEFORE LIVE BROWSER EVIDENCE
```

A guessed selector change, watcher tweak, or SSR guard is still guessing if you have not observed the runtime state.

## Tool Bias

This skill is Codex-first and dual-harness friendly.

Prefer live evidence from the browser before editing code.

### Primary path in Codex: Chrome DevTools MCP

- use `mcp__chrome-devtools__take_snapshot` to inspect the rendered accessibility tree
- use `mcp__chrome-devtools__list_console_messages` for hydration, runtime, and Vue warnings
- use `mcp__chrome-devtools__list_network_requests` and `mcp__chrome-devtools__get_network_request` for failed API or asset calls
- use `mcp__chrome-devtools__evaluate_script` to inspect `window`, DOM state, route params, and client-side data
- use `mcp__chrome-devtools__performance_start_trace` and `mcp__chrome-devtools__performance_stop_trace` only when the bug is performance-sensitive
- use `mcp__chrome-devtools__lighthouse_audit` only when the claim is UX, accessibility, or best-practices drift rather than logic failure

### Secondary path: Playwright

Use Playwright, Playwright MCP, or the project's Playwright suite only when:
- the bug needs scripted reproduction
- the same interaction must be repeated
- timing or state transitions need assertions
- the failure already exists in E2E coverage
- a visual or multi-step regression needs a repeatable script

If DevTools MCP is unavailable in the current harness, fall back to Playwright plus application logs. Do not require `js_repl`, helper scripts, or a repo-specific browser wrapper that does not exist in this project.

## When To Use

Use for:
- SSR or hydration mismatch
- page renders wrong state after navigation
- stale filters, pagination, or query-param sync
- component interaction bugs in Vuetify dialogs, forms, tables, or drawers
- frontend-only auth or route-guard issues
- flaky Playwright failures caused by selectors, timing, or network sequencing

Do not use this skill to broadly rewrite or expand the Playwright suite. Use `nimbou-skills:nuxt-test` when the main work is E2E test coverage or stabilization.

## Mandatory Flow

As quatro fases — reproduzir no browser com evidência ao vivo, isolar a causa-raiz, corrigir na camada certa e verificar no mesmo browser — estão em `reference/mandatory-flow.md`, com a inventário de QA e o gate de fixes falhos.

Leia esse arquivo antes de propor ou aplicar qualquer correção. Nenhuma fase é opcional.

## Nuxt-Specific Smells

Stop and investigate when you see:
- `window`, `document`, or storage access during SSR without a guard
- duplicate fetches from overlapping lifecycle hooks and watchers
- route query state drifting from local component state
- UI fixes that hide a stale store or composable bug
- waits based on `timeout` instead of observable conditions
- Playwright selectors tied to generated Vuetify structure instead of semantics
- inspecting the DOM too early while async rendering is still settling

## Red Flags

If you catch yourself thinking:
- "Let's add `nextTick` and see"
- "Maybe `await page.waitForTimeout(1000)` fixes it"
- "This is probably hydration weirdness"
- "I'll just force `client-only`"
- "The selector worked locally once"

Stop. Gather more browser evidence.

## Boundary With `nuxt-test`

- `nuxt-debug` is for investigation, ownership, and browser-verified fixes
- `nuxt-test` is for module-bounded Playwright coverage, selector discipline, waits, auth setup, and E2E stabilization
- If the main task is "make the suite trustworthy," route to `nuxt-test`

## Quick Reference

| Phase | Frontend focus | Exit criteria |
|-------|----------------|---------------|
| 1. Reproduce | Exact browser state, console, network, route, QA inventory | Failure observed with evidence |
| 2. Boundary | Route, composable, component, request, render ownership | First broken contract identified |
| 3. Compare | Working Nuxt/Vuetify path | Concrete differences listed |
| 4. Hypothesis | One explanation only | Confirmed or rejected with evidence |
| 5. Fix | One fix, browser recheck, short QA pass | Bug resolved and claim revalidated |

## Related Skills

- `nimbou-skills:nuxt-test`
- `nimbou-skills:nuxt-audit`
- `nimbou-skills:verification-before-completion`
