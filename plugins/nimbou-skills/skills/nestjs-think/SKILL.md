---
name: nestjs-think
description: "Use before backend design or implementation work. Drive NestJS, Prisma, Clean Architecture, and SOLID decisions into a closed design before code changes."
---

# NestJS Think

**Framework versions:** Use Nuxt 4 for Nuxt work. When Vuetify is involved, use Vuetify 4. Apply these versions to designs, examples, implementation, and reviews.

Turn backend requests into concrete NestJS-first designs before code changes. This skill is not stack-neutral: default to `NestJS + Prisma + Clean Architecture + SOLID`.

This skill owns backend coherence end to end at the design level: use-cases, transport, error mapping, and persistence viability stay together here unless the user explicitly asks to split them.

When the request is clearly frontend-first for Nuxt/Vuetify, use `nuxt-think` instead of forcing this workflow.
Use `feat-spec` when the request changes both frontend and backend or when the frontend depends on a new backend contract.
Use `change-plan` when a small change or bugfix touches both frontend and backend (existing flow or a small new feature).

Before closing backend design decisions, locate the nearest backend `GUIDELINES.md` in the target project when one exists. Start from the likely owning module or app, walk upward, and treat the closest file as the primary local implementation source. If none exists, continue with this skill as the fallback baseline.

<HARD-GATE>
Do NOT invoke any implementation skill, write any code, scaffold any project, or take any implementation action until the design is written and self-reviewed. A plan is not implementation: continue to `doc-openapi`, `nuxt-think`, and `fullstack-plan` when the user requested that path.
</HARD-GATE>

## Domain Specification Gate

Complete this gate before checklist step 1.

Before writing the implementation plan:

1. identify the target business domain
2. use `doc-domain` to create or update `docs/domain/<domain>/domain.md`
3. use `doc-gherkin` to create or update `docs/domain/<domain>/*.feature`
4. self-review the domain and Gherkin artifacts for consistency
5. do not advance with stale domain or Gherkin artifacts
6. if state transitions changed, regenerate the affected `.feature` files before planning
7. do not do the `domain.md` or `*.feature` work inline inside `nestjs-think`; delegate it to the shared spec skills
8. if the request splits into multiple independent domains, split them and close one domain at a time
9. for HTTP features, close the backend-viable transport contract before handing off to `doc-openapi`
10. close persistence viability for the chosen backend shape: repositories, transactions, Prisma boundaries, constraints, and schema impact when relevant
11. only after `doc-openapi` and `nuxt-think` are closed, invoke `nestjs-plan`
- when the work spans both stacks, that planning step is `fullstack-plan`, not `nestjs-plan`: one joint plan whose waves mix backend and frontend, so frontend tasks consuming the closed `openapi.yaml` do not queue behind backend implementation. Use `nestjs-plan` directly only for backend-only work

Treat the domain directory as the closed specification bundle for backend planning, route coverage, and later test generation. `doc-openapi` publishes the canonical transport contract after this skill closes the backend-viable shape.

**Pronto para planejar**

- `docs/domain/<domain>/domain.md` closed.
- `docs/domain/<domain>/*.feature` closed.
- Backend-viable contract, persistence viability, Prisma/schema impact, and review constraints are closed.
- `doc-openapi` is ready to publish `docs/domain/<domain>/openapi.yaml` when the feature changes HTTP.

## Checklist

You MUST create a task for each of these items and complete them in order:

1. **Explore project context** — inspect modules, Prisma schema, tests, docs, and recent commits
2. **Ask clarifying questions** — one at a time, understand purpose, boundaries, contracts, and success criteria
3. **Propose 2-3 backend approaches** — with trade-offs and your recommendation
4. **Present the design** — emphasize modules, boundaries, contracts, persistence, and tests
5. **Write design doc** — save to `docs/plans/YYYY-MM-DD-<topic>-design.md`
6. **Spec self-review** — check placeholders, contradictions, ambiguity, and boundary drift
7. **Continuous handoff** — publish the written spec and continue through the requested planning path
8. **Transition to planning** — invoke the appropriate planner after closure

## Process Flow

```dot
digraph nestjs_think {
    "Identify target domain" [shape=box];
    "Use doc-domain" [shape=box];
    "Use doc-gherkin" [shape=box];
    "Close backend-viable transport contract" [shape=box];
    "Domain Specification Gate complete" [shape=box];
    "Explore project context" [shape=box];
    "Ask clarifying questions" [shape=box];
    "Propose 2-3 backend approaches" [shape=box];
    "Present design sections" [shape=box];
    "Write design doc" [shape=box];
    "Spec self-review" [shape=box];
    "Invoke nestjs-plan" [shape=doublecircle];

    "Explore project context" -> "Ask clarifying questions";
    "Ask clarifying questions" -> "Propose 2-3 backend approaches";
    "Propose 2-3 backend approaches" -> "Present design sections";
    "Present design sections" -> "Write design doc";
    "Write design doc" -> "Spec self-review";
    "Spec self-review" -> "Invoke nestjs-plan";

    "Identify target domain" -> "Use doc-domain";
    "Use doc-domain" -> "Use doc-gherkin";
    "Use doc-gherkin" -> "Close backend-viable transport contract";
    "Close backend-viable transport contract" -> "Domain Specification Gate complete";
    "Domain Specification Gate complete" -> "Explore project context";
}
```

## Understanding the Request

- Check the current project state first: modules, controllers, DTOs, use-cases, repositories, Prisma schema, test suites, and recent commits.
- Extract any local backend rules from the nearest `GUIDELINES.md` before proposing the final shape. Focus on migration strategy, Prisma boundaries, repository responsibilities, API granularity, and test discipline.
- If the request describes multiple independent subsystems, decompose it before refining details. Each subsystem should get its own spec and later its own implementation plan.
- Ask focused questions only for decisions that change the design. Offer discrete options through the structured question UI when available, or concise text otherwise. Lead with a recommendation and its trade-off.
- Focus on:
  - public contract: HTTP, jobs, events, or internal use-case API
  - boundary placement: controller, application, domain, infrastructure
  - persistence shape: repository contracts, Prisma queries, transactions
  - persistence viability: cardinality, constraints, idempotency, auditing, and migration pressure
  - constraints: auth, validation, idempotency, migrations, observability
  - success criteria and test evidence

## Exploring Approaches

- Propose 2-3 backend approaches with trade-offs.
- Lead with your recommendation and explain why.
- When asking the user to pick between the proposed approaches, offer the approaches as concise options, using the structured question UI when available. Put the recommendation first and explain its trade-off.
- Explicitly discuss:
  - migration shape and rollback posture when schema or persistence behavior changes
  - module boundaries
  - dependency direction
  - whether the public contract should be chunky or batch-oriented instead of chatty
  - repository and use-case responsibilities
  - whether update flows should be partial/minimal payload or full replacement, and why
  - where Prisma belongs and where it must not leak
  - whether the closed backend contract is actually supportable by the intended persistence strategy
  - for each domain snapshot or audit history, which persisted fields retain the values at the time of the event, how later edits avoid rewriting that history, and how existing rows are migrated without losing it
  - for each identifier crossing HTTP and persistence, whether its concrete representation and generation strategy satisfy the declared OpenAPI type and format, including IDs created by a backfill
  - how SOLID influences the design

## Presenting the Design

Cover, when relevant:

- module structure
- request or command flow
- DTOs, validation, guards, filters, and serialization
- use-cases and service boundaries
- repository contracts and Prisma adapters
- transaction boundaries and error mapping
- schema impact, constraints, and persistence risks that could force contract changes
- migration phases when contract or schema evolution is not atomic
- batch validation strategy when arrays of identifiers or related entities are involved
- payload granularity expectations for update endpoints
- test strategy across HTTP, application, and persistence layers

Do not ask for confirmation after each section. Record assumptions and revise when the repository or request exposes a contradiction; ask the user only when a material ambiguity cannot be resolved from available evidence.

## Clean Architecture Granularity

Use cases and controllers are not the same artifact and do not map 1-to-1.

- **Use case = one business operation expressed as a verb.** One class, one `execute` method, one transaction of intent (`CreateProject`, `ApprovePaymentRequest`, `RejectScholarshipGrant`). Many small use cases beat one fat use case with internal branching.
- **Controller = transport adapter grouped by resource (noun).** Translates request to DTO, applies guards, calls a single use case per endpoint, maps the output to HTTP. A controller calls **many** use cases; that is correct and desired.
- **Healthy controller size: 5-20 routes per resource.** Above that, split by sub-aspect (lifecycle vs. attachments vs. workflow vs. queries) — never by individual operation.
- **Dependency direction:** Presentation → Application → Domain ← Infrastructure. Use cases never import Prisma, NestJS transport types, or `Request`/`Response`. Repositories implement domain interfaces.

Reject the anti-pattern "one controller per use case." That is CQRS-handler style (MediatR), not Clean Architecture. Adopting it inflates file count, breaks resource cohesion that NestJS and Swagger expect (`@ApiTags`, RBAC guards), and mixes transport with orchestration.

When the requested design pushes toward this anti-pattern, surface it explicitly and propose the resource-grouped shape instead.

## Design Rules

- Break the system into units with one clear purpose and explicit interfaces.
- Keep framework concerns, application logic, domain policies, and infrastructure separate.
- Treat Prisma as infrastructure. Repositories and adapters own persistence details.
- Prefer small, reversible changes and explicit expand-migrate-contract strategies over all-at-once rewrites when persistence shape changes.
- Prefer chunky contracts over chatty ones when the use case naturally supports batch operations.
- When validating arrays of identifiers, default to batch repository access patterns instead of N sequential lookups.
- Repositories persist and retrieve. They do not orchestrate multi-entity workflows, derive domain status, or absorb application caching concerns.
- Do not postpone obvious persistence contradictions to planning. If the contract and the data model fight each other, surface that here.
- If the existing code leaks Prisma into controllers or collapses use-cases into large services, call that out and propose the smallest correction that improves the current work.
- Stay focused on the requested goal. Do not propose unrelated refactors.

## After the Design

### Documentation

- Write the validated spec to `docs/plans/YYYY-MM-DD-<topic>-design.md`
- Do not leave placeholder sections or vague architecture prose

### Spec Self-Review

After writing the spec, check:

1. **Placeholder scan:** no `TBD`, `TODO`, or vague requirements
2. **Internal consistency:** architecture, requirements, and test strategy do not contradict each other
3. **Scope check:** the work still fits one implementation plan
4. **Ambiguity check:** requirements cannot be interpreted in multiple incompatible ways
5. **Boundary check:** controller, application, domain, and infrastructure concerns are separated
6. **Prisma check:** Prisma is confined to repository or adapter boundaries
7. **Migration check:** schema-impacting changes have a reversible evolution story when needed
8. **Contract check:** chatty endpoints, looped validations, or full-form update payloads are justified instead of accidental

Fix issues inline before continuing.

### Continuous Handoff

After the self-review loop passes, publish the written spec and continue to the next requested planning skill. Do not ask for approval of the spec or its next step. If the user explicitly requests a review checkpoint or requests changes, honor it and re-run the self-review loop after changes.

## Key Principles

- **Ask only material questions**
- **Use a structured question UI for discrete choices when available**; concise text is the fallback
- **YAGNI ruthlessly**
- **Explore alternatives before committing**
- **Incremental validation**
- **NestJS-first for backend work**
- **Clean boundaries over convenience**
- **Use case per business verb, controller per resource noun** — never one controller per use case
- **Prisma discipline**
- **SOLID over short-lived hacks**

## Transition

When the backend design is closed, the next skill is:

- `doc-openapi` for HTTP features
- `nuxt-think` for frontend design on top of the published contract
- `nestjs-plan` only after `doc-openapi` and `nuxt-think` are closed when the feature is fullstack
