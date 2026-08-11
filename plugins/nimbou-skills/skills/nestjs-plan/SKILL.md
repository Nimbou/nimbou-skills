---
name: nestjs-plan
description: Use after design approval to write a backend implementation plan focused on NestJS, Prisma, Clean Architecture, and SOLID.
---

# NestJS Plan

## Overview

Write implementation plans for backend work assuming the engineer has zero context for the codebase. The plan must force good boundaries, make the NestJS and Prisma structure explicit, and leave little room for architecture drift.

Assume the engineer is competent but does not know the domain, layering rules, or test strategy.

**Announce at start:** "I'm using the nestjs-plan skill to create the implementation plan."

**Save plans to:** `docs/plans/YYYY-MM-DD-<feature-name>.md`
- User preferences override this default.

When the target backend has a relevant `GUIDELINES.md`, consume it as a constraint source before writing the plan. Default to the nearest app-level or module-level file and let a closer file override a broader one.

## Scope Check

If the approved spec still covers multiple independent subsystems, split it before writing the plan. Each plan should produce working, testable software on its own.

## File Structure First

Before writing tasks, map the file structure and responsibility of each file.

- Make the boundary explicit:
  - controller or transport (one controller per resource/aggregate, 5-20 routes; split by sub-aspect — lifecycle, attachments, workflow, queries — never one controller per use case)
  - DTOs and validation
  - application or use-case layer (one use case per business verb; each use case has one `execute` method and one reason to change)
  - domain contracts or policies
  - infrastructure adapters and Prisma repositories
  - tests per boundary
- Make migration sequencing explicit when schema, persistence semantics, or shared contracts change.
- Keep Prisma outside controllers and use-cases unless the existing codebase already violates this and the plan includes the cleanup.
- In existing codebases, follow established patterns when they are sound. If the current structure is muddy, plan the smallest refactor that restores a clean boundary.

This file map drives the task decomposition.

## Task Granularity

Each step should be a small action, typically 2-5 minutes:

- write the failing HTTP or use-case test
- run it to prove it fails
- implement the minimal controller, use-case, or repository code
- rerun the test
- commit

## Plan Document Header

Every plan MUST start with this header:

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use nimbou-skills:executing-plans to implement this plan wave-by-wave. Steps use checkbox (`- [ ]`) syntax for tracking. Every task is driven by its failing test: run the `RED:` command and report its output before writing implementation. The run ends with one spec-compliance pass over every wave plus a boundary pass over the backend diff, and the final wave runs `nimbou-skills:nestjs-test` scoped strictly to the suites/files touched by this plan — never the full backend suite.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about NestJS modules, boundaries, and Prisma ownership]

**Tech Stack:** [Key technologies/libraries]

---
```

## Task Structure

````markdown
### Task N: [Use-case or Slice Name]

**Role:** `<role-slug>`
**Onda:** N
**Files:** `src/modules/.../create-invoice.use-case.ts`, `src/modules/.../create-invoice.spec.ts`
**Consome:** `nada`
**RED:** `pnpm test -- --runInBand src/modules/.../create-invoice.spec.ts` — espera FAIL por comportamento ausente (`DuplicateInvoiceReferenceError` não lançado), não por import, DI ou sintaxe
**Verificação:** `pnpm test -- --runInBand src/modules/.../create-invoice.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
describe('CreateInvoiceUseCase', () => {
  it('rejects duplicate external references', async () => {
    await expect(
      sut.execute({ externalReference: 'dup-1' }),
    ).rejects.toThrow(DuplicateInvoiceReferenceError)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --runInBand path/to/spec` (scoped to this spec only — never `pnpm test` without a path)
Expected: FAIL with the missing behavior or missing provider error that proves the test is real

- [ ] **Step 3: Write minimal implementation**

```ts
@Injectable()
export class CreateInvoiceUseCase {
  constructor(
    @Inject(INVOICE_REPOSITORY)
    private readonly invoiceRepository: InvoiceRepository,
  ) {}

  async execute(input: CreateInvoiceInput): Promise<CreateInvoiceOutput> {
    const existing = await this.invoiceRepository.findByExternalReference(
      input.externalReference,
    )

    if (existing) {
      throw new DuplicateInvoiceReferenceError(input.externalReference)
    }

    return this.invoiceRepository.create(input)
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --runInBand path/to/spec` (same scoped path as Step 2 — do not widen to the full suite)
Expected: PASS

````

Do **not** add a commit step to a task. `nimbou-skills:executing-plans` commits once per
wave, after every task in it lands and verifies. Tasks inside a wave run in parallel, so
per-task commits would interleave into unreviewable history.

## Execution Contract

The fields above the checklist are what `nimbou-skills:executing-plans` extracts to
dispatch the task. They exist so the executor performs extraction, not interpretation —
a field the executor has to infer is a field it can infer wrong.

| Field | Rule |
|---|---|
| `**Role:**` | One slug from Role Mapping below. Never omit it outside the final `nestjs-test` wave. |
| `**Onda:**` | The wave number this task belongs to. Explicit — never leave the executor to infer wave membership from prose. |
| `**Files:**` | Every file this task WRITES, comma-separated. This is the task's write set: two tasks in the same wave must not share a file. Files the task only reads do not belong here. |
| `**Consome:**` | The contracts this task consumes from earlier waves — types, signatures, routes, DTOs, schema fields — **pasted as actual declarations**, not referenced by name. Write `nada` only for Onda 1. |
| `**RED:**` | The command that runs the task's test **before** any implementation exists, plus the class of failure it must produce. Same scoped path as `Verificação`. Write `n/a — <motivo>` when the task carries no testable behavior. |
| `**Verificação:**` | The single command that proves the task is done, expecting PASS. Scoped path always; a bare `pnpm test` is a planning failure. |

Rules that are easy to get wrong:

- **`Consome` is mandatory from Onda 2 on.** A later wave exists *because* it consumes something an earlier wave produced. If you cannot name what a task consumes, the wave boundary was wrong — merge it into the earlier wave. The implementer subagent has none of your context: a task told it consumes nothing will redeclare the type it should have imported.
- **`RED` and `Verificação` are the same command, run at two different moments.** RED is Step 2 of the checklist (expects FAIL, before implementation); `Verificação` is Step 4 (expects PASS, after). They are separate fields because the executor reports both, and a task that only ever ran green is not a task that was driven by its test.
- **Declare the failure *class*, never the literal message.** You are writing the plan before any code exists — `Cannot find module` and `Nest can't resolve dependencies` are guesses, and a wrong guess leaves the implementer choosing between fudging the report and blocking. Write what the failure must prove instead: `espera FAIL por comportamento ausente, não por import, DI ou sintaxe`. That is checkable a priori and is exactly the distinction the Iron Law cares about — a test that fails because it does not compile tests nothing.
- **`RED: n/a` requires a reason, always.** A Prisma migration or a pure module-composition task has no behavior to drive out; say so (`n/a — migration expand-step, sem comportamento`). What is forbidden is the silent omission. If you find yourself writing `n/a` on a task that creates a use-case, the task is wrong, not the field.
- **Run the scoped command once, in the target repo, before writing it into a task.** A path appended to a package script does not reliably reach the test runner: package managers append extra args to the **end of the whole script string**, so a script that chains (`vitest run … && pnpm run lint:rules`) silently hands your path filter to the *last* command. The observable result is the worst possible one for TDD — the runner executes the **entire** suite unfiltered, and the trailing command fails on an argument it never expected, so `RED` goes red no matter what the code does and `Verificação` can never go green. Neither field then proves anything. When the script chains, bypass it and invoke the runner directly (`pnpm --filter <pkg> exec vitest run --config <cfg> <path>`). Copying the form from an older plan in the same repo is not verification: the older plan may carry the same bug, and that is exactly how it propagates.

### Tasks that carry no RED

Only two shapes qualify, and both are structural rather than behavioral:

- `prisma-schema-author` tasks whose whole output is schema plus a generated migration.
- Pure module composition — a task whose diff is provider registration and nothing else.

Everything else — use-cases, repositories, controllers, guards, filters — has behavior, therefore has a RED. A controller task's RED is a route-level test that 404s before the route exists.

## Role Mapping

Every task MUST declare a `**Role:**` line that names the agent-author who will execute it under `nimbou-skills:executing-plans`. The slug is one of:

| Role slug | When to use |
|---|---|
| `nimbou-skills:prisma-schema-author` | Task touches `schema.prisma` and/or generates a migration. No application code in the same task. |
| `nimbou-skills:prisma-repository-author` | Task implements or extends a concrete repository under `infra/persistence/` (or equivalent) against an existing application port. |
| `nimbou-skills:nestjs-usecase-author` | Task creates or evolves one application use-case (one business verb) and the ports it consumes. No HTTP wiring, no Prisma. |
| `nimbou-skills:nestjs-controller-author` | Task wires HTTP transport: controller, HTTP DTO, guards, validation pipes, module composition. No business logic. |

Rules:

- One role per task. If a single task description would fit two roles, split it into two tasks (one per role) before closing the plan.
- Tasks under `nestjs-test` final-wave dispatch do not declare `Role:` — they are routed through the test auditors directly.
- A task without `Role:` will fall back to `general-purpose` in SDD with a warning. Treat that as a planning bug to be fixed, not a feature.

## No Placeholders

These are plan failures:

- `TBD`, `TODO`, `implement later`
- `Add validation`, `handle edge cases`, `add proper error handling`
- `Write tests for the above` without actual test code
- `Similar to Task N`
- a `#### Task N` heading left as a tombstone for work you cut — `(removed)`, `(merged into Task M)`. Every task heading is dispatched: without `Onda` it inherits the section's wave, without `Role` it falls back to `general-purpose` and is logged as a planning bug, and an implementer is opened to read the word "removed". Delete the heading and let the numbering skip
- a `Role` field holding anything but a slug. The executor copies it verbatim into the agent type, so a justification or an italicised `n/a` becomes a nonexistent agent. The only task that may lack an owner is the `nestjs-test` final wave, and it **omits the field** rather than explaining itself in it
- a `Consome` written as *"the same declarations as Task N"* instead of the pasted declarations. Even when the real dependency is an earlier wave, the pointer reads as a lateral one and leaves the implementer without the contract
- references to types, functions, or methods not defined in any task
- `Create DTO/use-case/repository as needed` without exact names and locations
- `Use Prisma here` without defining which adapter or repository owns that access

## Planning Rules For This Repository

- Always express execution as **`## Ondas de Execução`** (waves). Within a wave, every task runs in parallel by default; the only reason to put work in a later wave is that it consumes a contract, schema, type, or shared module produced by an earlier wave.
- Default wave shape:
  1. **Onda 1 — Contratos:** DTOs, domain contracts and ports, Prisma migrations expand-step. Only what a later wave literally imports. **Tests do not belong here** — a test is consumed by no one, and splitting it away from its implementation hands RED to one agent and GREEN to another, which is test-first, not TDD.
  2. **Onda 2 — Implementação Independente:** use-cases, domain services, repository adapters, fixtures — each with its own test, written first, inside the same task. Dispatch in parallel — they share no mutable state.
  3. **Onda 3 — Wiring NestJS:** controllers, guards, filters, interceptors, module composition. Parallel per module.
  4. **Onda Final — Verificação:** dispatch `nimbou-skills:nestjs-test` with scope covering **only the files this plan changed** — the controllers, use-cases, repositories, Prisma adapters, and migrations introduced or modified across waves 1 through N. The final-wave task list must enumerate the exact suites/files (paths) that need stabilization or expansion, derived from the plan's diff. **Never dispatch the full backend test suite.** The runner command must always carry a scoped path filter (e.g., `pnpm test -- --runInBand <suite-path>`); the unfiltered `pnpm test` is forbidden as a verification step.
- Collapse or split waves only when a real dependency or its absence justifies it. Two waves with no shared contract should be one wave.
- Review happens once, at the end of the run, not per wave: the executor dispatches a spec-compliance pass over every committed wave plus a `guidelines-gap-analyzer` pass over the backend diff. Do not write per-wave review checkpoints into the plan. Full `/code-review` is not part of the run — with every task driven by a failing test and the gap analyzer covering boundaries, run it over the branch when you want the extra pass, not by default.
- If the request is HTTP-facing, include controller, DTO, guard, filter or interceptor, and route-level verification tasks.
- If the request is persistence-heavy, include repository contracts, Prisma adapters, fixture strategy, and integration-test tasks.
- If the request spans both, make dependency direction explicit so application logic does not depend on Prisma or NestJS transport details.
- If arrays of identifiers or related entities are validated, plan `findByIds`-style repository support and batch assertions instead of per-id loops.
- If update endpoints are partial by contract, plan DTO, test, and repository work so only changed fields are sent and handled.
- If a lint or static rule enforces Prisma boundaries, include the exact verification command in the final wave.
- Plan one use case per business verb and group endpoints under the resource controller that already owns the aggregate. If a planned controller exceeds ~20 routes, split it by sub-aspect (lifecycle / attachments / workflow / queries) instead of creating one controller per use case.

## Remember

- exact file paths always
- complete code in every code-changing step
- exact commands with expected output
- DRY, YAGNI, TDD, frequent commits
- the plan should read like a Clean Architecture implementation guide, not a generic checklist

## Self-Review

After writing the complete plan, check:

1. **Spec coverage:** every approved requirement maps to one or more tasks
2. **Placeholder scan:** no red-flag placeholders remain
3. **Type consistency:** later tasks use the same names and signatures defined earlier
4. **Boundary consistency:** controllers stay thin and resource-grouped (5-20 routes, split by sub-aspect when larger), use-cases stay framework-light with one verb per class, Prisma stays in infrastructure tasks
5. **Migration consistency:** schema-impacting work has ordered expand, migrate, and contract steps when relevant
6. **Contract efficiency:** chatty endpoints, per-id validation loops, and full-payload updates are not planned by accident
7. **Test coverage:** the plan proves behavior at HTTP, application, and persistence levels when relevant
8. **TDD shape:** every task that carries behavior owns its test *and* its implementation — no task writes a test another task implements, and no wave is a wave of tests. Every `RED: n/a` names a reason, and that reason is a schema/migration or pure-composition task, never a use-case, repository, or controller
9. **Wave shape:** every later wave is justified by a real contract dependency on an earlier wave; tasks inside a wave are genuinely parallel-safe (no shared file writes, no implicit ordering)
10. **Deletion ownership:** a task that deletes a file owns **every** consumer of it, or lands in a later wave than the last consumer to be migrated. Grep the symbol before planning the delete — a helper with two importers where you assumed one leaves the wave committed with an import pointing at nothing. If the last consumer is out of scope, the deletion is out of scope too: say so instead of deleting
11. **Assertion dependencies:** a task whose test asserts behavior another task implements must be in a **later** wave, not the same one. Same-wave tasks run in parallel, so an e2e that exercises a route *and* the read path feeding it will go red on ordering rather than on a defect — and the wave commits looking broken. Read each test task's assertions and place the task after everything they touch
12. **Execution Contract:** every task carries `Role`, `Onda`, `Files`, `Consome`, `RED`, and `Verificação`. No task declares a commit step. `Consome` is non-empty for every task outside Onda 1, and holds pasted declarations rather than names. `RED` declares a failure class, not a literal error string
13. **Write-set completeness:** every concrete file path named anywhere in a task's body — including a one-line edit that reads as obvious, like declaring the inverse side of a relation — appears in that task's `Files`. An implementer is instructed to stop rather than write outside its declared boundary, so a path the task mentions but does not declare blocks the wave. "It is one line" is precisely the case that gets left out.
14. **Final wave:** the final wave dispatches `nimbou-skills:nestjs-test` with scope restricted to the files this plan touched — every controller, use-case, repository, and migration introduced anywhere in the plan, **and nothing else**. The verification command must include explicit suite paths; an unfiltered `pnpm test` is a planning failure.

Fix issues inline before handing off the plan.

## Execution Handoff

After saving the plan, offer the execution choice using the `AskUserQuestion` tool. Do not narrate the options as prose.

Question: "Plan saved to `docs/plans/<filename>.md`. Which execution mode?"

Use `nimbou-skills:executing-plans` to implement this plan wave-by-wave.

## How To Ask The User

This skill assumes design is closed. Use `AskUserQuestion` only when execution topology is genuinely blocked by a missing structural decision that resolves to 2-4 discrete options, such as:

- whether a shared file or contract must land before dependent files (serial vs parallel groups)
- which target file path or module owns a contested capability when more than one is viable
- whether to reuse an existing repository/use-case or introduce a new one

Lead with your recommendation as the first option and append `(Recommended)` to its label.

Do not use `AskUserQuestion` for:

- open file naming or describing prose
- plan-approval gates — present the plan and wait for review, do not multiple-choice the approval itself
