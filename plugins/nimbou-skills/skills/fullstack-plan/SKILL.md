---
name: fullstack-plan
description: Use when a feature spans a NestJS or Laravel backend and a Nuxt frontend and both sides have approved designs and a stable shared contract.
---

# Fullstack Plan

## Overview

Produce a single wave-structured plan covering both stacks, so frontend work runs alongside backend work instead of queueing behind it.

Separate backend and frontend plans execute one after the other and serialize work that has no dependency between it. A frontend component consuming an approved contract does not need the backend implementation to exist yet; it needs the approved contract.

**Core principle:** a frontend task depends on the **approved contract**, never on a backend task.

**Announce at start:** "I'm using the fullstack-plan skill to produce one joint plan."

## Expensive-check policy

Do not add, create, or execute **frontend** Playwright/browser E2E coverage in a plan,
final wave, `Verificação`, or post-execution handoff unless the user explicitly
requests that E2E work. Backend verification, including backend Playwright when it
fits the contract, remains available. Do not add or execute `typecheck` unless the
user explicitly requests it. Use a smaller relevant frontend proof when one is needed.

## Boundary

This skill owns **wave topology across the two stacks**, and nothing else.

It does **not** restate platform rules. They have one home each, and this skill defers to them:

- **Backend tasks** follow exactly one detected planner: `nimbou-skills:nestjs-plan` for NestJS/Prisma or `nimbou-skills:laravel-plan` for Laravel/Eloquent. Inspect the target repository and record the selected backend in the plan header.
- **Frontend tasks** follow `nimbou-skills:nuxt-plan` — Role Mapping, `DESIGN.md` and `GUIDELINES.md` resolution, component catalog reuse, naming, layout strategy, and `## Pos-execucao`.

Read the relevant planner before writing tasks for that side. When this file and a platform planner disagree about a platform rule, the platform planner wins — this file is only authoritative about how the waves interleave.

Do not use this skill when the work touches one stack only. Use the detected backend planner or `nuxt-plan` directly.

## Precondition Gate

Do not start until all of these hold. Each is a real input, not a formality:

1. `docs/domain/<domain>/domain.md` approved.
2. `docs/domain/<domain>/*.feature` approved.
3. `docs/domain/<domain>/openapi.yaml` approved when the feature changes HTTP. **This is what unblocks the frontend.** Without it there is no joint plan to write — frontend tasks would have nothing stable to consume, and you would be back to serializing.
4. `nestjs-think` or `laravel-think` closed backend contract and persistence viability for the detected stack.
5. `nuxt-think` closed UI structure, reuse, state ownership, and responsive behavior.

If the contract is not closed, stop and close it. Planning around an unstable contract produces waves that look parallel and are not.

## The Dependency Rule

**A frontend task never declares a dependency on a backend task.**

Its `Consome` field cites the approved `openapi.yaml` — the route, the payload shape, the error mapping — not a use-case, repository, or controller.

When you catch yourself putting a frontend task in a later wave *because a backend task must land first*, one of two things is true, and both are bugs:

- **the contract was not actually closed** — the frontend needs something `openapi.yaml` does not specify. Go back and close it.
- **the wave boundary is wrong** — the dependency is imagined. Move the task earlier.

The same rule runs the other way: a backend task never waits on a frontend task. If it appears to, the ownership boundary from `feat-spec` or `change-plan` was not closed.

Real cross-stack dependencies exist in exactly one place: **end-to-end verification**, which needs both sides landed. That belongs in the final wave.

## Wave Topology

The default shape. Collapse or split only when a real contract dependency justifies it.

| Onda | Backend | Frontend |
|---|---|---|
| 1 — Contratos | stable declarations and migration/schema expand-step defined by the selected backend planner | types derived from `openapi.yaml`, fixtures |
| 2 — Implementação | use-cases, domain services, repository adapters — each with its test, written first, in the same task | components, composables, utils |
| 3 — Wiring | controllers, guards, filters, interceptors, module composition | page and layout integration, route wiring |
| Final — Verificação | scoped `nestjs-test` for NestJS, or the declared scoped Laravel verification task | catalog verification; a test command only when explicitly requested |

Both sides occupy Onda 2 at the same time. That is the whole point of the skill.

### Dispatch is not task count

`executing-plans` does **not** open one subagent per task. After the write-set check it
coalesces only **short** work by `Role`: one implementer per `Role` per wave may receive up to three
`Estimativa: curta` tasks of the same `Role`. `media` and `longa` tasks always get an
independent lane when their write sets are disjoint. Each task keeps its own `Files`,
`RED` and `Verificação` and is reported separately — short tasks share setup; heavier
tasks do not wait behind a sibling just because they have the same owner.

Two consequences the plan must be written against:

- **Do not size a wave, or advise on its cost, by counting tasks.** The dispatch count
  depends on Roles, `Estimativa`, and write-set collisions — not merely task count.
  Writing "this wave is expensive, consider slicing it" from the task count is advice
  about a run that does not exist.
- **Coalescing can hide an intra-wave dependency.** Tasks inside one implementer run
  sequentially in the order given, so a task that consumes a sibling in the same wave will
  *work* whenever the two land in the same lane in the right order, and break when the cap
  pushes them into different lanes. The defect passes, then reappears after an unrelated
  reordering. This is why Self-Review item 1 is first and why it is not optional.

**Onda 1 carries no tests, on either side.** A test is consumed by no later wave, and splitting it away from its implementation hands RED to one agent and GREEN to another — test-first, not TDD. Backend tests live inside the task that implements the behavior.

**The two stacks are not symmetric about TDD, deliberately.** Backend tasks are test-driven and declare `RED:`. Frontend tasks are not: the browser-level equivalent is a Playwright run, which is too slow and too coupled to serve as a short red-green cycle, and unit-testing a Vuetify component mostly asserts the framework. Frontend quality is covered by the `guidelines-gap-analyzer` pass and by `/code-review`, where reading the diff is cheap and asserting the visual result is expensive — the opposite of the backend's economics. Do not invent a frontend RED to make the table look balanced.

**Unbalanced sides are normal and correct.** If the backend needs three implementation waves and the frontend finishes in one, the frontend simply has no task in the later waves. Do not invent frontend work to fill a wave, and do not hold a wave open waiting for symmetry. One shared wave numbering, gaps allowed.

## Execution Contract

Every task carries the fields `nimbou-skills:executing-plans` extracts, with one exception: the `nestjs-test` final wave declares **no `Role`** because the NestJS planner routes it through test auditors. Laravel final verification follows `laravel-plan` and declares `Role: general-purpose`.

```md
#### Task N: <nome>
**Role:** `<slug from the owning platform planner's Role Mapping>`
**Onda:** N
**Files:** `<files this task WRITES, comma-separated>`
**Consome:** `<pasted declarations>` | `nada`
**Estimativa:** `curta` | `media` | `longa`
**RED:** `<command that must FAIL before implementation>` — <failure class it must produce>
**Verificação:** `<scoped command that proves the task done, expecting PASS>`
```

Rules specific to a joint plan:

- **`RED` follows the selected platform planner.** Backend behavior tasks declare the failure class, never a literal message. Frontend tasks write `**RED:** `n/a — frontend, coberto por review``.

- **Write sets are checked across both stacks.** Two tasks in the same wave must not share a file. Backend and frontend rarely collide, but generated types, shared constants, and `openapi.yaml`-derived files do.
- **`Consome` for a frontend task quotes the contract**, pasted: the route, the request and response shape, the error cases. Not "the endpoint from Task 3".
- **`Consome` is mandatory from Onda 2 on**, on both sides. A task that consumes nothing belongs in Onda 1.
- **No task declares a commit step.** `executing-plans` commits once per wave, and a wave now mixes both stacks — per-task commits would interleave two stacks' history.
- **Roles come from the owning platform planner.** NestJS uses its specialized roles, Laravel currently uses explicit `general-purpose`, and frontend roles come from `nuxt-plan`.

## Response Shape

```md
# Plan: [Feature Name]

> **For agentic workers:** REQUIRED SUB-SKILL: Use nimbou-skills:executing-plans to implement this plan wave-by-wave. Waves mix backend and frontend tasks. Backend tasks are driven by their failing test; frontend tasks declare `RED: n/a`. The final wave uses the verification contract of the selected backend planner and scoped Nuxt checks.

**Goal:** [one sentence]
**Contrato:** `docs/domain/<domain>/openapi.yaml` [approved on <date or commit>]
**Ownership:** [what frontend owns locally vs what backend owns centrally]
**Backend planner:** `nestjs-plan` | `laravel-plan`

## Contexto

## Decisoes Fechadas

## Arquivos
| Acao | Caminho | Stack | Onda | Role | Consome |

## Ondas de Execução
### Onda 1 — Contratos
#### Task 1: ... (backend)
#### Task 2: ... (frontend)
### Onda 2 — Implementação
### Onda 3 — Wiring
### Onda Final — Verificação

## Riscos e Validacoes

## Pos-execucao
```

## Self-Review

After writing the plan, check:

1. **No intra-wave dependency, in either stack:** read every task's `Consome` and ask which task *produces* what it names. If that producer sits in the **same wave**, the plan is broken — merge the two tasks, or move the producer to an earlier wave. This check is not the same as item 2 and does not reduce to it: item 2 is about the frontend queueing behind the backend, and this one bites hardest **between two tasks of the same stack and the same `Role`**, which is exactly where it is hardest to see and most dangerous to miss (see *Dispatch is not task count* above).

   Two shapes to watch, both real:
   - a shared helper, service, or util created by task A and consumed by task B in the same wave. Fix: move the helper into the earlier wave. If it carries no behavior of its own — a composition over ports the consumers' own specs already cover — it can live in Onda 1 without a test, and the plan says so in its `RED: n/a` reason.
   - a `Consome` written as *"the same declarations as Task N"* or *"the ones cited in Task N"*. Even when the real dependency is an earlier wave, the reference reads as a lateral one and leaves the implementer without the contract in hand. `Consome` is **pasted declarations**, never a pointer to a sibling.
   - **a task whose test asserts behavior a sibling implements.** This one hides from the `Consome` check, because the dependency is written in the assertions rather than in the field: a route-level e2e that also exercises the read path feeding the route consumes that read path, whether or not the plan says so. The failure mode is the nastiest of the three — the wave commits with a red suite, and the redness is about ordering, not about a defect, so the next reader debugs the wrong thing. Read the assertions, not just `Consome`, and place the task after everything they touch.

   Do **not** answer any of these three with "same `Role`, same lane, so it runs in order." That is the trap *Dispatch is not task count* describes: the ordering holds only while the cap keeps both tasks in one implementer, and breaks silently when an unrelated task is added to that role.

2. **Contract closed:** every frontend `Consome` traces to approved `openapi.yaml`, and none names a backend task
3. **No false serialization:** for every frontend task outside Onda 1, the reason it is not earlier is a contract it consumes — not a backend task landing
4. **Write sets:** no two tasks in the same wave write the same file, across both stacks
5. **Write-set completeness:** every concrete file path named anywhere in a task's body — including a one-line edit that reads as obvious, like declaring the inverse side of a relation — appears in that task's `Files`. An implementer is instructed to stop rather than write outside its declared boundary, so a path the task mentions but does not declare blocks the wave. "It is one line" is precisely the case that gets left out.
6. **Execution Contract:** every field on every task; no commit steps
7. **Deletion ownership, across both stacks:** a task that deletes a file owns **every** consumer of it, or lands in a later wave than the last consumer to be migrated. Grep the symbol before planning the delete. Two importers where you assumed one leaves the wave committed with an import pointing at nothing — and in a joint plan the second consumer is often in the *other* stack, or in a slice this feature does not otherwise touch. When the last consumer is out of scope, the deletion is out of scope too: say so in the plan instead of deleting.
8. **Scoped commands are verified, not composed:** run each distinct `RED`/`Verificação` shape once in the target repo before writing it into a task. Package managers append extra args to the end of the **whole** script string, so a script that chains (`vitest run … && pnpm run lint:rules`) hands your path filter to the *last* command: the runner executes the full suite unfiltered and the trailing command fails on an argument it never expected. `RED` then goes red regardless of the code and `Verificação` can never go green — both fields stop proving anything. Bypass the script and invoke the runner directly when it chains. Copying the form from an older plan in the same repo is not verification; that is how the bug propagates.
9. **No orphan task headings.** Every `#### Task N` heading is a task the executor will dispatch. A heading kept as a tombstone for work you cut — `#### Task N: (removed)`, `#### Task N: merged into Task M` — is parsed as a real task: it has no `Onda`, so it inherits the wave of the section it sits under, and it has no `Role`, so it is dispatched as `general-purpose` **and logged as a planning bug**. An implementer is opened to read the word "removed". Delete the heading and let the numbering skip; say so in a note if a reader would otherwise look for the missing number.
10. **`Role` holds a slug, nothing else.** The executor copies it verbatim into the agent type, so prose becomes a nonexistent agent. Omit it only for the `nestjs-test` final wave; Laravel final verification declares `general-purpose`.
11. **TDD shape:** Onda 1 contains no tests on either side. Every backend task carrying behavior owns its test and its implementation, and declares a `RED` failure class. Every frontend task declares `RED: n/a — frontend, coberto por review`. No `n/a` on a backend use-case, repository, or controller
12. **Roles:** every slug exists in the owning platform planner's Role Mapping
13. **Platform rules:** backend tasks respect the selected `nestjs-plan` or `laravel-plan`; frontend tasks respect `nuxt-plan`
14. **Final wave:** use the selected backend planner's scoped verification; never run an unfiltered backend suite
15. **Balance is not a goal:** waves with work on one side only are fine when the dependency graph says so

Fix issues inline before handing off.

## Integration

Upstream — this skill runs after all of them:

- `nimbou-skills:feat-spec` or `nimbou-skills:change-plan` — closes the shared boundary and routes here (`change-plan` routes here only when the change escalates past its small-work threshold)
- `nimbou-skills:nestjs-think` or `nimbou-skills:laravel-think` — backend contract and persistence viability
- `nimbou-skills:doc-openapi` — publishes the `openapi.yaml` this plan depends on
- `nimbou-skills:nuxt-think` — UI structure, reuse, state ownership

Deferred to for platform rules:

- `nimbou-skills:nestjs-plan` or `nimbou-skills:laravel-plan` — backend roles, boundaries, task body, and final verification
- `nimbou-skills:nuxt-plan` — frontend Role Mapping, design resolution, catalog reuse

Downstream:

- `nimbou-skills:executing-plans` — executes the joint plan; already dispatches backend and frontend roles inside the same wave
