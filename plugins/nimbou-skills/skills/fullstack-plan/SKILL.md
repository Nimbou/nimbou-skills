---
name: fullstack-plan
description: Use when a feature or change spans NestJS backend and Nuxt frontend and both sides are ready to plan, to produce ONE wave-structured plan that runs backend and frontend work in the same waves instead of one platform after the other.
---

# Fullstack Plan

## Overview

Produce a single wave-structured plan covering both stacks, so frontend work runs alongside backend work instead of queueing behind it.

Two separate plans — one from `nestjs-plan`, one from `nuxt-plan` — execute one after the other. That serializes work that has no dependency between it. A frontend component consuming an approved contract does not need the use-case that serves it to exist yet; it needs the contract, and the contract was approved before either plan was written.

**Core principle:** a frontend task depends on the **approved contract**, never on a backend task.

**Announce at start:** "I'm using the fullstack-plan skill to produce one joint plan."

## Boundary

This skill owns **wave topology across the two stacks**, and nothing else.

It does **not** restate platform rules. They have one home each, and this skill defers to them:

- **Backend tasks** follow `nimbou-skills:nestjs-plan` — Role Mapping, Clean Architecture boundaries, Prisma ownership, controller sizing, migration sequencing, the `## Task Structure` body, and the scoped `nestjs-test` final wave.
- **Frontend tasks** follow `nimbou-skills:nuxt-plan` — Role Mapping, `DESIGN.md` and `GUIDELINES.md` resolution, component catalog reuse, naming, layout strategy, and `## Pos-execucao`.

Read the relevant planner before writing tasks for that side. When this file and a platform planner disagree about a platform rule, the platform planner wins — this file is only authoritative about how the waves interleave.

Do not use this skill when the work touches one stack only. Use `nestjs-plan` or `nuxt-plan` directly; a joint plan for single-platform work is pure overhead.

## Precondition Gate

Do not start until all of these hold. Each is a real input, not a formality:

1. `docs/domain/<domain>/domain.md` approved.
2. `docs/domain/<domain>/*.feature` approved.
3. `docs/domain/<domain>/openapi.yaml` approved when the feature changes HTTP. **This is what unblocks the frontend.** Without it there is no joint plan to write — frontend tasks would have nothing stable to consume, and you would be back to serializing.
4. `nestjs-think` closed backend contract and persistence viability.
5. `nuxt-think` closed UI structure, reuse, state ownership, and responsive behavior.

If the contract is not closed, stop and close it. Planning around an unstable contract produces waves that look parallel and are not.

## The Dependency Rule

**A frontend task never declares a dependency on a backend task.**

Its `Consome` field cites the approved `openapi.yaml` — the route, the payload shape, the error mapping — not a use-case, repository, or controller.

When you catch yourself putting a frontend task in a later wave *because a backend task must land first*, one of two things is true, and both are bugs:

- **the contract was not actually closed** — the frontend needs something `openapi.yaml` does not specify. Go back and close it.
- **the wave boundary is wrong** — the dependency is imagined. Move the task earlier.

The same rule runs the other way: a backend task never waits on a frontend task. If it appears to, the ownership boundary from `feat-spec` or `change-spec` was not closed.

Real cross-stack dependencies exist in exactly one place: **end-to-end verification**, which needs both sides landed. That belongs in the final wave.

## Wave Topology

The default shape. Collapse or split only when a real contract dependency justifies it.

| Onda | Backend | Frontend |
|---|---|---|
| 1 — Contratos | DTOs, domain contracts and ports, Prisma migration expand-step | types derived from `openapi.yaml`, fixtures |
| 2 — Implementação | use-cases, domain services, repository adapters — each with its test, written first, in the same task | components, composables, utils |
| 3 — Wiring | controllers, guards, filters, interceptors, module composition | page and layout integration, route wiring |
| Final — Verificação | `nestjs-test` scoped strictly to the files this plan changed | catalog verification and scoped `/test` in `## Pos-execucao` |

Both sides occupy Onda 2 at the same time. That is the whole point of the skill.

**Onda 1 carries no tests, on either side.** A test is consumed by no later wave, and splitting it away from its implementation hands RED to one agent and GREEN to another — test-first, not TDD. Backend tests live inside the task that implements the behavior.

**The two stacks are not symmetric about TDD, deliberately.** Backend tasks are test-driven and declare `RED:`. Frontend tasks are not: the browser-level equivalent is a Playwright run, which is too slow and too coupled to serve as a short red-green cycle, and unit-testing a Vuetify component mostly asserts the framework. Frontend quality is covered by the `guidelines-gap-analyzer` pass and by `/code-review`, where reading the diff is cheap and asserting the visual result is expensive — the opposite of the backend's economics. Do not invent a frontend RED to make the table look balanced.

**Unbalanced sides are normal and correct.** If the backend needs three implementation waves and the frontend finishes in one, the frontend simply has no task in the later waves. Do not invent frontend work to fill a wave, and do not hold a wave open waiting for symmetry. One shared wave numbering, gaps allowed.

## Execution Contract

Every task carries the fields `nimbou-skills:executing-plans` extracts, regardless of which stack it belongs to:

```md
#### Task N: <nome>
**Role:** `<slug from the owning platform planner's Role Mapping>`
**Onda:** N
**Files:** `<files this task WRITES, comma-separated>`
**Consome:** `<pasted declarations>` | `nada`
**RED:** `<command that must FAIL before implementation>` — <failure class it must produce>
**Verificação:** `<scoped command that proves the task done, expecting PASS>`
```

Rules specific to a joint plan:

- **`RED` is a backend field.** Backend tasks declare it under `nestjs-plan`'s rules: the failure *class*, never a literal error string, and `RED: n/a — <motivo>` only for schema/migration or pure module composition. Frontend tasks write `**RED:** `n/a — frontend, coberto por review``. The executor requires the field to be present on every task precisely so its absence cannot be silent; what differs across stacks is the value, not the presence.

- **Write sets are checked across both stacks.** Two tasks in the same wave must not share a file. Backend and frontend rarely collide, but generated types, shared constants, and `openapi.yaml`-derived files do.
- **`Consome` for a frontend task quotes the contract**, pasted: the route, the request and response shape, the error cases. Not "the endpoint from Task 3".
- **`Consome` is mandatory from Onda 2 on**, on both sides. A task that consumes nothing belongs in Onda 1.
- **No task declares a commit step.** `executing-plans` commits once per wave, and a wave now mixes both stacks — per-task commits would interleave two stacks' history.
- **Roles come from the owning platform planner.** Backend slugs are in `nestjs-plan`, frontend slugs in `nuxt-plan`. Never invent a slug and never infer one from the file path.

## Response Shape

```md
# Plan: [Feature Name]

> **For agentic workers:** REQUIRED SUB-SKILL: Use nimbou-skills:executing-plans to implement this plan wave-by-wave. Waves mix backend and frontend tasks. Backend tasks are driven by their failing test: run the `RED:` command and report its output before writing implementation; frontend tasks declare `RED: n/a`. The run ends with one spec-compliance pass over every wave plus a boundary pass over the diff, and the final wave runs `nimbou-skills:nestjs-test` scoped strictly to the suites this plan touched.

**Goal:** [one sentence]
**Contrato:** `docs/domain/<domain>/openapi.yaml` [approved on <date or commit>]
**Ownership:** [what frontend owns locally vs what backend owns centrally]

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

1. **Contract closed:** every frontend `Consome` traces to approved `openapi.yaml`, and none names a backend task
2. **No false serialization:** for every frontend task outside Onda 1, the reason it is not earlier is a contract it consumes — not a backend task landing
3. **Write sets:** no two tasks in the same wave write the same file, across both stacks
4. **Execution Contract:** every field on every task; no commit steps
5. **TDD shape:** Onda 1 contains no tests on either side. Every backend task carrying behavior owns its test and its implementation, and declares a `RED` failure class. Every frontend task declares `RED: n/a — frontend, coberto por review`. No `n/a` on a backend use-case, repository, or controller
6. **Roles:** every slug exists in the owning platform planner's Role Mapping
7. **Platform rules:** backend tasks respect `nestjs-plan` boundaries; frontend tasks respect `nuxt-plan` reuse and design resolution
8. **Final wave:** `nestjs-test` scoped to this plan's files with explicit suite paths — never an unfiltered `pnpm test`
9. **Balance is not a goal:** waves with work on one side only are fine when the dependency graph says so

Fix issues inline before handing off.

## Integration

Upstream — this skill runs after all of them:

- `nimbou-skills:feat-spec` or `nimbou-skills:change-spec` — closes the shared boundary and routes here
- `nimbou-skills:nestjs-think` — backend contract and persistence viability
- `nimbou-skills:doc-openapi` — publishes the `openapi.yaml` this plan depends on
- `nimbou-skills:nuxt-think` — UI structure, reuse, state ownership

Deferred to for platform rules:

- `nimbou-skills:nestjs-plan` — backend Role Mapping, boundaries, task body
- `nimbou-skills:nuxt-plan` — frontend Role Mapping, design resolution, catalog reuse

Downstream:

- `nimbou-skills:executing-plans` — executes the joint plan; already dispatches backend and frontend roles inside the same wave
