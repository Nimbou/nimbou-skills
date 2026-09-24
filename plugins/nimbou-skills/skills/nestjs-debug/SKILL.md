---
name: nestjs-debug
description: Use for backend bugs, test failures, or unexpected behavior in NestJS/Prisma systems before proposing fixes.
---

# Systematic Debugging

Backend debugging in this repository is not stack-neutral. Default to `NestJS + Prisma + Clean Architecture + SOLID`.

Use this skill for backend issues first. If the problem is clearly browser/UI-first in Nuxt/Vuetify, use `nuxt-debug` instead.

## Core Rule

```text
NO FIXES BEFORE ROOT CAUSE
```

If you have not traced the failure to a concrete boundary, you are not ready to fix it.

## When To Use

Use for:
- failing NestJS tests
- broken controllers, guards, pipes, interceptors, or filters
- wrong use-case behavior
- repository or Prisma regressions
- transaction, validation, auth, or serialization bugs
- flaky integration between HTTP, application, and persistence layers

Use this especially when:
- the failure looks "obvious"
- you already tried one fix
- the stack trace ends deep in framework code
- the same bug appears across controller, use-case, and repository layers

## Mandatory Flow

Complete each phase in order.

### Phase 1: Investigate Root Cause

1. Read the error fully.
   - Keep the full NestJS stack trace.
   - Note the first application frame, not just the last framework frame.
   - Capture route, DTO, use-case, repository, query, and transaction context.

2. Reproduce consistently.
   - Prefer the smallest failing command or test.
   - If failure is HTTP-level, reproduce with one request path and one payload.
   - If failure is persistence-level, reproduce with one repository call and known fixture state.

3. Check recent change surface.
   - changed module wiring
   - changed DTOs or validators
   - changed guards, interceptors, or filters
   - changed repository contracts or Prisma schema
   - changed env, migrations, seeds, or feature flags

4. Instrument each backend boundary before fixing.

   For a typical NestJS flow:

   ```text
   Request -> Guard -> Pipe -> Controller -> Use case -> Repository -> Prisma -> DB
   ```

   Add temporary evidence at the boundary that might be lying:
   - incoming request params/body/user
   - transformed DTO or parsed query
   - use-case input and output
   - repository arguments
   - Prisma query shape and transaction scope
   - persisted state before and after the call

   Run once, collect evidence, then remove or narrow the instrumentation.

5. Trace the bad value backward.
   - Where did the wrong value first become wrong?
   - Which layer first violated the contract?
   - Did the bug start in mapping, validation, branching, repository translation, or data state?

See `root-cause-tracing.md` in this directory when the bad value appears deep in the call stack.

### Phase 2: Compare Against Working Patterns

1. Find the nearest working example in the same codebase.
   - same controller pattern
   - same use-case style
   - same repository contract
   - same Prisma access pattern

2. Compare the broken path to the working path line by line.
   - module wiring
   - DTO validation rules
   - guard assumptions
   - transaction boundaries
   - repository return shape
   - serialization and exception mapping

3. List differences before changing anything.
   - Do not collapse multiple differences into one guess.
   - Do not assume framework behavior without evidence from this codebase.

### Phase 3: Form One Hypothesis

State it explicitly:

```text
I think X is the root cause because Y.
```

Then test only that hypothesis.

- Make the smallest possible change or probe.
- Change one variable at a time.
- If the hypothesis fails, discard it and return to Phase 1 with the new evidence.

### Phase 4: Fix and Verify

1. Create the failing check first.
   - Prefer an automated test.
   - Pick the smallest level that proves the root cause:
     - controller/e2e when the contract is wrong
     - use-case/unit when the rule is wrong
     - repository/integration when persistence is wrong

   Use `nimbou-skills:test-driven-development` when you need the exact RED-GREEN-REFACTOR discipline.

2. Implement one fix.
   - Fix the layer that owns the bug.
   - Do not bury a boundary bug under controller-side workarounds.
   - Do not "stabilize" a Prisma issue by weakening assertions upstream.

3. Verify broadly enough.
   - rerun the failing test
   - rerun adjacent tests for the same module or repository
   - confirm no contract drift at HTTP or persistence boundaries

4. If the fix fails, stop and re-open the investigation.
   - After 2 failed fix attempts, assume your model is weak.
   - After 3 failed fix attempts, question the architecture or the chosen boundary.

## NestJS-Specific Smells

Stop and investigate if you see any of these:
- controller compensating for repository behavior
- Prisma types leaking into controller or DTO code
- giant service methods hiding multiple use-cases
- exception filters masking domain or persistence bugs
- request-scoped state or auth context silently disappearing between layers
- transactions opened too high or too low in the call chain
- tests mocking around the boundary that is actually broken

## Red Flags

If you catch yourself thinking:
- "I'll patch the controller for now"
- "The DTO is probably wrong"
- "Let's update the repository and the test together"
- "The ORM is weird; I'll work around it"
- "This looks like a Nest bug"
- "I don't fully understand the module graph, but this should work"

Stop. Return to investigation.

## Quick Reference

| Phase | Backend focus | Exit criteria |
|-------|---------------|---------------|
| 1. Root cause | Trace request, module, use-case, repository, Prisma flow | You know where the contract first breaks |
| 2. Pattern | Compare with working backend path | Concrete differences listed |
| 3. Hypothesis | Test one explanation | Confirmed or rejected with evidence |
| 4. Fix | Add failing check, fix owner layer, verify | Bug resolved and nearby tests still pass |

## Supporting Material

- `root-cause-tracing.md` - trace failures backward through the call stack
- `defense-in-depth.md` - add validation at the right layers after the root cause is fixed
- `condition-based-waiting.md` - use condition-based waits instead of arbitrary sleeps when tests are timing-sensitive

Related skills:
- `nimbou-skills:test-driven-development`
- `nimbou-skills:verification-before-completion`
