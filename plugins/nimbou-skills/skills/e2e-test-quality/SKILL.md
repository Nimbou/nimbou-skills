---
name: e2e-test-quality
description: Use when auditing, fixing, stabilizing, or expanding bounded end-to-end tests for a critical user flow or feature slice
---

# E2E Test Quality

For frontend flows, dispatch `e2e-quality-auditor` only when the user explicitly asks
for browser-driven end-to-end coverage or its audit. Do not infer that request from
ordinary frontend implementation. Backend flows may use this skill when browser-driven
coverage is the appropriate test level.

**Core principle:** Audit one bounded user flow at a time. Keep selectors, waits, auth, data setup, and end-to-end assertions explicit.

## When to Use

Use this skill when:
- Playwright, Cypress, or equivalent E2E tests became flaky
- auth, session, seed, or reset assumptions are making end-to-end tests unreliable
- a critical flow needs bounded E2E coverage without turning the suite into a timing lottery
- you need to determine whether an E2E failure is test-side, environment-side, product-side, or mixed

Do not use this skill for controller or module-level HTTP confidence. Use `nestjs-test` for that.

Do not use this skill for repository or persistence confidence. Use `nestjs-test` for that.

Do not use this skill for Nuxt/Vuetify module-local Playwright work when `nuxt-test` already fits the request and the problem is not broader E2E flow reliability.

## Required Inputs

Before dispatching the auditor, gather:
- the target user flow or bounded feature slice
- the relevant E2E test files or command
- the expected user-visible behavior to preserve
- any known flaky cases, failures, or setup assumptions
- the auth, seed, reset, or orchestration context needed for the flow

If the request is broad, reduce it to one critical flow first.

## How to Run

Use Task tool with `e2e-quality-auditor`.

Include:
- what user flow or feature slice is under audit
- which test files or command cover that flow
- what user-visible behavior must be preserved
- any known flaky behavior, failures, or timing problems
- how auth, seed, environment, and reset are currently expected to work

## Dispatch Template

```text
Task tool (e2e-quality-auditor):
  TARGET: [bounded user flow or feature slice]
  TEST_SCOPE: [test file(s) or command]
  EXPECTED_BEHAVIOR: [critical end-to-end behavior to preserve]
  KNOWN_ISSUES: [optional flakes, failures, or missing scenarios]
  CONTEXT: [auth, seed, reset, orchestration, environment assumptions]
```

## After the Audit

- Fix Critical E2E quality issues immediately
- Fix Important issues before claiming end-to-end confidence
- Keep Minor issues visible if they can wait
- If product code changes are proposed, verify the E2E failure exposed a real defect rather than a weak test or setup problem

## Red Flags

Never:
- audit multiple unrelated flows in one pass
- hide flakiness behind retries, sleeps, or weaker assertions
- claim product regressions without separating test, setup, and application causes
- use this skill when the problem belongs to HTTP-only or persistence-only test depth
