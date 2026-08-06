---
name: nestjs-test
description: Stabilize and expand backend HTTP and persistence tests from approved Gherkin, routing audit work through the NestJS backend auditors.
---

# NestJS Test

Read `reference/test-conventions.md` before changing tests.

## Purpose

Own gherkin-driven backend test generation, audit dispatch, and stabilization for NestJS modules and Prisma repositories.

## When to Use

Use this skill when the main job is:
- generate backend coverage from approved Gherkin
- stabilize a fragile HTTP or persistence test
- route audit work through the backend auditors
- close a plan's final verification wave (see **Final-Wave Mode** — narrower job)

Do not use this skill as the default runtime investigation workflow. Use `nestjs-debug` when the main task is to investigate runtime behavior before deciding how to test it.

## Modes

- **gherkin-driven mode** - use approved `docs/domain/<domain>/*.feature` files to add or expand backend coverage
- **audit mode** - dispatch `nestjs-http-test-auditor` or `prisma-repository-test-auditor`
- **stabilize mode** - tighten fragile backend tests without weakening observable contracts
- **final-wave mode** - the closing wave of a plan executed by `nimbou-skills:executing-plans`

## Final-Wave Mode

When dispatched as a plan's last wave, the job is **narrower than the other modes**, and mistaking one for the other wastes a whole wave.

Every task in that plan was already driven by its own failing test — that is what the `RED:` field enforces. Unit-level coverage for the plan's behavior therefore already exists. Writing it again here is not thoroughness, it is rework, and it produces a second assertion of the same behavior that then has to be maintained alongside the first.

What this mode owns instead:

1. **Run** the suites covering the plan's files, scoped to explicit paths. Never an unfiltered `pnpm test`.
2. **Stabilize** what is fragile — order dependence, shared fixture leakage, timing, anything that passed per-task and breaks when the plan's suites run together.
3. **Close the seams between tasks.** This is the real gap, and the only place new tests belong here. Each task proved its own slice in isolation; nobody proved that the controller, the use-case, and the repository compose. A route-level test that exercises the full path is in scope precisely because no single task could have written it.

What it does not own: re-testing a use-case that already has a passing spec, adding coverage for behavior outside this plan's diff, or widening to modules the plan did not touch.

If you find a plan behavior with no test at all, that is a finding about the plan — the task's `RED` was fake or skipped. Write the missing test *and* report it, so the gap shows up in follow-ups instead of being silently patched here.

## Workflow

1. Map one bounded backend flow or persistence slice.
2. Run only the relevant backend tests.
3. Build a small QA checklist for that flow.
4. Diagnose whether each failure belongs to the test, the backend, the environment/setup, or more than one of these.
5. Fix test-side problems first when the contract is already correct.
6. Fix product code only when the test exposed a real backend defect.
7. Add the missing tests for the bounded flow and rerun only that slice.

## Rules

- do not invent scenarios outside approved Gherkin
- choose one module or persistence slice at a time
- keep HTTP and Prisma confidence explicit instead of mixing them implicitly
- use the existing backend audit agents as internal execution tools, not as user-facing skills
- keep stable fixtures in `beforeAll` when tests do not mutate them, and keep `beforeEach` cleanup surgical
- extract helpers only after real duplication appears, not preemptively
- helpers may simplify mechanics, but they must not hide the domain state the test is supposed to prove
