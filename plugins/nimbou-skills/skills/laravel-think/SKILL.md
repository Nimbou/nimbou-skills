---
name: laravel-think
description: Use before designing or implementing a conventional Laravel backend, especially when API contracts, authorization, Eloquent persistence, transactions, queues, or a Nuxt consumer must be reconciled. Not for the Nimbou CMS shell.
---

# Laravel Think

**Framework versions:** Use Nuxt 4 for Nuxt work. When Vuetify is involved, use Vuetify 4. Apply these versions to designs, examples, implementation, and reviews.

Turn backend requests into an approved Laravel design before code changes. Prefer the lightest architecture that keeps business rules, authorization, transactions, and persistence coherent; do not force either fat Eloquent models or framework-agnostic Clean Architecture by default.

Use `nimbou-cms-think` for the Nimbou CMS shell. Use `nuxt-think` for frontend-only work. For fullstack work, enter through `feat-spec` (large feature) or `change-plan` (small change); backend design still returns here.

<HARD-GATE>
Do not write implementation code, migrations, or scaffolding until the design is presented and approved.
</HARD-GATE>

## Specification gate

Before planning:

1. Identify the business domain.
2. Use `doc-domain` for `docs/domain/<domain>/domain.md` and `doc-gherkin` for its `*.feature` files; obtain approval and refresh them when states or invariants change.
3. Inspect `composer.json`, the nearest `GUIDELINES.md`, routes, controllers, Form Requests, Resources, Policies, models, migrations, jobs, tests, and recent commits.
4. Close the backend-viable contract and persistence design. For HTTP changes, hand the approved shape to `doc-openapi`.
5. Use `laravel-plan` only for backend-only work. Fullstack work ends in `fullstack-plan` after `doc-openapi` and `nuxt-think` are approved.

when the work spans both stacks, that planning step is `fullstack-plan`, not separate `laravel-plan` and `nuxt-plan` documents.

## Design workflow

1. Ask one question at a time about purpose, actors, tenancy, lifecycle, authorization, external effects, and success criteria.
2. Present 2–3 grounded approaches with trade-offs. Consider Laravel-native controllers/models, application Actions or Services, and stronger domain isolation only when the domain or existing code justifies it.
3. Recommend one approach and present the design in reviewable sections.
4. Save the approved design to `docs/plans/YYYY-MM-DD-<topic>-design.md`.
5. Self-review it and ask the user to review the file. After approval, invoke `laravel-plan` for backend-only work or continue through `doc-openapi` + `nuxt-think` to `fullstack-plan` when Nuxt changes too.

## Decisions to close

- **Transport:** route grouping, request/response shapes, pagination, errors, idempotency, and API versioning when relevant.
- **Input and output:** Form Requests own transport validation; API Resources or the established presenter own serialization. Do not expose accidental Eloquent shapes as the contract.
- **Authorization:** middleware authenticates; Policies/Gates cover resource access; state-sensitive business restrictions must also hold inside the transactional application operation.
- **Application boundary:** one Action/use case per business verb when workflow or reuse warrants it. Thin controllers parse, call, and map; they do not orchestrate multi-step state changes.
- **Eloquent:** models own relationships, casts, scopes, and local invariants. Avoid placing cross-aggregate workflows, notifications, or request-specific orchestration in model hooks.
- **Persistence:** close cardinality, constraints, indexes, tenant scoping, locking/versioning, soft-delete or audit posture, and expand–migrate–contract needs. Add repositories only when a real abstraction or test seam justifies them.
- **Transactions and effects:** define the atomic write boundary. Dispatch jobs, notifications, and integration events after commit when observers must not see rolled-back state; define retry and deduplication behavior.
- **Tests:** default to HTTP feature tests for public behavior, focused unit tests for domain policies/Actions, and database integration tests for queries, constraints, locking, or tenant isolation.

For arrays of identifiers, prefer batch queries and set comparison over per-id loops. For partial updates, preserve omitted values rather than rebuilding a full model payload. Surface conflicts between the desired contract and Eloquent/database viability now, not in planning.

## Design output

Include scope, actors and invariants, lifecycle, route/contract sketch, authorization matrix, controller/Action/model boundaries, schema and migration impact, transaction/concurrency behavior, queued or external effects, error mapping, test strategy, and the explicit Nuxt handoff when applicable.

## Self-review

Check that there are no placeholders or incompatible interpretations; controllers remain coordinators; authorization is enforced at every required boundary; Eloquent concerns do not leak into the public contract; transactions include every invariant-preserving write; tenant filters and unique constraints agree; after-commit effects are explicit; migrations are reversible where practical; and the test strategy proves HTTP, business, and persistence behavior in proportion to risk.

## Transition

After approval:

- HTTP contract: `doc-openapi`.
- Frontend consuming that contract: `nuxt-think`.
- Backend-only implementation planning: `laravel-plan`.
- Laravel + Nuxt implementation planning: `fullstack-plan`.
