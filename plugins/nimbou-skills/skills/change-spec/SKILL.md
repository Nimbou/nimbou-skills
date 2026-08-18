---
name: change-spec
description: Use when a request changes both frontend and backend in an existing flow and needs one shared change spec (markdown file under docs/plans/) with explicit impact analysis before implementation.
---

# Change Spec

Use this skill when the request changes both frontend and backend in an existing flow. Its job is to write a single frontend/backend change spec as a markdown file after closing the shared change boundary and the downstream impact.

Use `feat-spec` when the work is a new feature slice or depends on a new backend contract. This skill is for evolving behavior that already exists.

This skill does not create domain-level specification artifacts. If `docs/domain/<domain>/`, Gherkin, OpenAPI, or prior plans already exist, consume them as constraints instead of generating them.

## Artifact Policy

- do not create or update `docs/domain/<domain>/domain.md`
- do not create or update `docs/domain/<domain>/*.feature`
- do not create or update `docs/domain/<domain>/openapi.yaml`
- write the change spec as a markdown file under `docs/plans/change-spec-<slug>.md`, where `<slug>` is a short kebab-case name for the change
- if the domain artifacts above exist, read them and call out any mismatch with the requested change in the spec

## Flow

1. confirm the request is a mixed change over an existing flow
2. inspect the current code path, contracts, tests, docs, and local patterns before asking questions
3. close what changes, what stays compatible, and which side owns each part of the change
4. challenge accidental rewrites, full-payload updates, chatty contracts, and duplicated state ownership
5. run the impact checklist below
6. write one combined change spec to `docs/plans/change-spec-<slug>.md` using the structure in Output, then summarize it briefly in chat with the file path; do not hand off to `nestjs-think`, `nuxt-think`, `doc-domain`, or `doc-openapi` as the default next step

## Impact Checklist

Before planning, explicitly map the impact checklist across contracts, UI states, jobs, permissions, tests, migrations, and compatibility.

Check, when relevant:

- transport contracts, DTOs, shared types, and validation already in use
- persistence shape, migrations, backfill, and compatibility constraints
- use-cases, repositories, jobs, queues, webhooks, and other side effects
- guards, permissions, visibility rules, and audit trails
- existing components, composables, pages, stores, wrappers, and reuse points
- loading, empty, error, success, optimistic, and rollback UI states
- frontend and backend tests already protecting the flow, plus missing coverage that the plan must add
- rollout or fallback constraints when old and new behavior may coexist

## How To Ask The User

Ask only when the ambiguity is material and cannot be closed from the code or existing artifacts.

Use the structured question tool when the decision reduces to 2-4 discrete choices, especially for:

- partial update vs full replacement
- frontend-local vs backend-authoritative state
- chunky vs chatty transport changes
- compatibility posture when old clients or payloads may persist

## Output

Write the change spec to `docs/plans/change-spec-<slug>.md` with a top-level `# Change Spec: <título>` heading followed by these sections:

- `## Contexto Atual`
- `## Mudanca e Decisoes Fechadas`
- `## Mapa de Impacto`
- `## Arquivos/Areas`
- `## Ondas de Execução`
- `## Validacoes e Riscos`
- `## Pos-execucao`

Inside `## Arquivos/Areas`, list exact paths or bounded areas, the action, the wave, the role, and the dependency.

Inside `## Ondas de Execução`, mix frontend and backend work in the same wave whenever they are parallel-safe. Split waves only on real dependency.

After writing the file, respond in chat with the file path and a short summary of the closed decisions and the impact map — do not paste the whole file back.

**When the change is large enough to need a real execution plan, hand the wave structure to `nimbou-skills:fullstack-plan` instead of detailing it here.** This skill closes decisions and impact; it is deliberately light and does not carry the Execution Contract fields, Role Mapping, or the scoped `nestjs-test` final wave that `executing-plans` needs. Keep the inline `## Ondas de Execução` only for changes small enough to execute straight from this spec.

`## Pos-execucao` may recommend `executing-plans` for implementation. Do not recommend `finishing-a-development-branch` here — the primary deliverable of this skill is the change spec file itself.
