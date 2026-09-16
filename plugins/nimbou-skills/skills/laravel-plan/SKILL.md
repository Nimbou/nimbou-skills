---
name: laravel-plan
description: Use after approval of a conventional Laravel backend design to produce an exact, test-first implementation plan covering Eloquent persistence, migrations, Actions or Services, authorization, HTTP resources, transactions, queues, and scoped verification. Not for Nimbou CMS modules.
---

# Laravel Plan

**Framework versions:** Use Nuxt 4 for Nuxt work. When Vuetify is involved, use Vuetify 4. Apply these versions to designs, examples, implementation, and reviews.

Write a backend implementation plan that an engineer with no prior context can execute. Use the approved `laravel-think` design and, for HTTP work, the approved `docs/domain/<domain>/openapi.yaml`. Use `nimbou-cms-plan` instead for CMS modules.

Announce this skill and save the plan to `docs/plans/YYYY-MM-DD-<feature-name>.md` unless the user chooses another path. Read `CLAUDE.md`, the nearest `GUIDELINES.md`, `composer.json`, neighboring Laravel files, and the actual test/quality scripts before naming files or commands.

## Preconditions

- The design, `domain.md`, and affected Gherkin scenarios are approved.
- Contract, authorization, transaction, concurrency, schema, and external-effect decisions are closed.
- `openapi.yaml` is approved when HTTP changes.
- The plan is backend-only. If implementation also changes Nuxt, use `fullstack-plan` and let it combine `laravel-plan` with `nuxt-plan` rules.

## Expensive-check policy

Backend verification may use the test level that fits the Laravel/module behavior,
including Playwright when appropriate. Do not add or execute `typecheck` unless the
user explicitly requests it.

## File map first

Map exact responsibilities before tasks: routes; controllers; Form Requests; API Resources; Policies/Gates; Actions or Services; models, casts, scopes, and queries; migrations and constraints; jobs/listeners/events; tests at the HTTP, application, and database boundaries. Follow sound local structure. Add repositories only when the approved design calls for a real abstraction; do not translate NestJS/Prisma layering mechanically.

## Task contract

One task owns one behavior and its RED→GREEN cycle. Never put a test in one task and its implementation in another. `executing-plans` commits once per wave, so tasks contain no commit step.

Every task must contain:

```markdown
### Task N: <business behavior or structural slice>
**Role:** `general-purpose`
**Onda:** N
**Files:** `<every file this task writes, comma-separated>`
**Consome:** `<pasted declarations from earlier waves>` | `nada`
**Estimativa:** `curta` | `media` | `longa`
**RED:** `<scoped test command>` — expects failure because the behavior is absent, not because of syntax, bootstrap, or database connectivity
**Verificação:** `<the same scoped test command, expecting PASS>`
```

The body supplies complete test and implementation snippets appropriate to the target repository, then instructs the implementer to run RED before implementation and the same command after it. Never guess whether the project uses Pest, PHPUnit, Sail, Docker, host PHP, Pint, or Larastan: inspect and run each distinct command shape once before writing it into the plan. An unfiltered `php artisan test` is not a scoped verification command.

Use `RED: n/a — migration/schema-only task, no executable behavior` only for a task whose entire output is schema/migration or immutable declarations, and `RED: n/a — pure framework registration` only for provider/route registration with no behavior. Models, queries, Actions, Policies, controllers, jobs, and listeners carry behavior and require a RED.

`general-purpose` is the only Laravel role currently guaranteed by the executor. Declare it explicitly; do not invent Laravel role slugs. A future specialized author may replace it only after that agent type exists in the plugin.

### Dispatch is not task count

`executing-plans` starts from one implementer per `Role` per wave for short work and coalesces up to three `Estimativa: curta` tasks into that lane; `media` and `longa` tasks receive independent lanes when their write sets are disjoint. Since Laravel currently uses one role, order tasks contiguously, in dependency order, but never rely on lane order to hide a same-wave dependency. Size waves from real dependencies and write sets, not the number of task headings.

## Execution waves

Use `## Ondas de Execução`. A later wave exists only when it consumes a contract, schema, type, or behavior from an earlier wave. Tasks in the same wave must have disjoint write sets and no hidden test dependency.

1. **Onda 1 — Schema and stable declarations:** additive migrations, indexes/constraints, enums/value declarations, and interfaces that later tasks literally consume. No behavior or detached tests.
2. **Onda 2 — Independent application and persistence behavior:** transactional Actions/Services, Eloquent queries/scopes, locks, audit writes, idempotency, and after-commit events/jobs. Each behavior owns its focused test.
3. **Onda 3 — HTTP and authorization wiring:** Policies, Form Requests, Resources, controllers, routes, exception mapping, and route-level feature tests. Keep controllers at parse → call → map.
4. **Onda Final — Scoped verification:** enumerate only affected test files and configured static/format checks. Include migration verification only against the project's disposable test database. Do not use `nestjs-test` or run the entire Laravel suite by default.

Collapse waves when there is no real dependency; split them when migrations, contracts, or stateful behavior must land first. Same-wave work must not rely on task order, even when all tasks share `general-purpose`.

## Laravel planning rules

- Form Requests validate transport input; Policies/Gates authorize resources; the transactional Action rechecks state-sensitive invariants against current data.
- API Resources preserve the approved response contract; do not serialize Eloquent models accidentally.
- The transaction contains every write required to preserve the invariant. Locks/version checks, tenant predicates, unique constraints, idempotency records, and audit rows must agree.
- Jobs, notifications, and integration events that observe committed state are dispatched after commit and have an explicit retry/deduplication test posture.
- Batch identifier validation uses set-based queries, not N+1 loops.
- Partial updates distinguish omitted fields from explicit nulls.
- Migrations include rollback/forward-fix posture and expand–migrate–contract phases when an atomic change is unsafe.
- Stay within scope; do not add architecture cleanup unless the approved design requires it.

## Plan header

```markdown
# <Feature> Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `nimbou-skills:executing-plans` wave by wave. Run and report each task's RED before implementation. Commit once per wave. Finish with one spec-compliance and boundary review plus the scoped Laravel verification declared here.

**Goal:** <one sentence>
**Architecture:** <Laravel boundaries and transaction posture>
**Contract:** <approved OpenAPI path or n/a>
**Tech stack:** <versions and tools observed in the repository>
```

## Self-Review

**Write-set completeness:** every concrete file path named in a task body appears in its `Files`.

Before handing off, verify: every requirement maps to a task; no placeholders; every task has an honest `Estimativa`; every later `Consome` pastes real declarations and never says “same declarations as Task N”; no same-wave dependency or shared file; behavioral tasks own both test and implementation; RED and verification use the same proven scoped command; authorization, tenant scope, transactions, constraints, concurrency, after-commit effects, and error mapping match the design; no NestJS/Prisma terminology or `nestjs-test` remains; and the final wave names exact Laravel test paths.

Delete tombstone task headings such as “Task N: removed” instead of leaving them in the plan: every task heading is dispatched. `Role` contains only the slug because the executor copies it verbatim into the agent type; prose there becomes a nonexistent agent.

After saving the plan, ask the user to review it. Execution begins only after approval through `executing-plans`.
