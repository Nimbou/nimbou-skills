---
name: e2e-test-quality
description: Use when auditing, fixing, stabilizing, or expanding bounded end-to-end tests for a critical user flow or feature slice
---

# E2E Test Quality

**Framework versions:** Use Nuxt 4 for Nuxt work. When Vuetify is involved, use Vuetify 4. Apply these versions to designs, examples, implementation, and reviews.

For frontend flows, use this skill only when the user explicitly asks for
browser-driven end-to-end coverage or its audit. Backend flows may use it when
browser-driven coverage is the appropriate test level.

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

Before auditing, gather:
- the target user flow or bounded feature slice
- the relevant E2E test files or command
- the expected user-visible behavior to preserve
- any known flaky cases, failures, or setup assumptions
- the auth, seed, reset, or orchestration context needed for the flow

If the request is broad, reduce it to one critical flow first.

## How to Run

Inspect the bounded flow, its test files, and its auth, seed, reset, and timing
assumptions. Run only the relevant E2E command. Classify each failure as test,
environment, product, or mixed before changing assertions or product code.
Delegate only when the user explicitly authorizes multi-agent work; pass the
same bounded scope and ask for conclusions rather than raw logs.

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
