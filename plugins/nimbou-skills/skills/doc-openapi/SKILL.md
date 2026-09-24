---
name: doc-openapi
description: Use when `nestjs-think` or `laravel-think` has closed a backend-viable HTTP contract and frontend/backend work need one canonical transport artifact.
---

# Doc OpenAPI

## Purpose

Create or update `docs/domain/<domain>/openapi.yaml` as the canonical HTTP transport contract for a feature slice.

## When to Use

Use this after the selected backend design skill (`nestjs-think` or `laravel-think`) and before `nuxt-think` when the feature adds or changes an HTTP endpoint that frontend and backend both depend on.

Do not use this skill for:

- purely internal backend refactors
- Eloquent, Prisma, or repository design
- async jobs or event contracts without HTTP
- frontend-only visual work

## Preconditions

Before generating `openapi.yaml`:

1. `docs/domain/<domain>/domain.md` must exist and be internally consistent with the feature
2. the relevant `docs/domain/<domain>/*.feature` files must exist and be internally consistent with that domain map
3. the backend-viable HTTP contract must already be closed in `nestjs-think` or `laravel-think`
4. the HTTP contract must be traceable to those artifacts

Do not ask the user to approve `openapi.yaml`. Write it, self-check traceability and consistency, then continue to the next requested planning step. Pause only when the user explicitly requests review or a material ambiguity prevents a coherent contract.

## Output

- `docs/domain/<domain>/openapi.yaml`
- keep it beside `domain.md` and the `.feature` files
- treat it as the shared transport contract for backend and frontend planning
- `nuxt-think` should consume this contract instead of redefining it

## Rules

- support Codex only
- generate only HTTP transport contracts
- reflect closed domain states and Gherkin behavior; do not invent transport behavior
- include paths, methods, params, request body, success responses, error responses, and auth expectations when relevant
- preserve closed batch operations instead of decomposing them into multiple chatty endpoints
- preserve closed partial update semantics when the contract is intentionally minimal-payload
- include error response shapes that make batch validation failures and missing identifiers explicit when relevant
- include only the minimum schemas needed for the closed feature slice
- declare identifier formats precisely and check that examples and the backend's planned generators/backfills produce values in that format; `format: uuid` requires the canonical UUID string representation, not an undelimited 32-character hex string
- keep examples compact and illustrative
- do not include controller names, class names, Eloquent/Prisma models, SQL details, or framework wiring
- if the feature spans multiple unrelated HTTP slices, keep one coherent `openapi.yaml` per domain directory and scope it to the closed slice
