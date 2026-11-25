---
name: feat-spec
description: Take a large feature spanning Nuxt and a NestJS or Laravel backend from shared specification through one fullstack implementation plan. Use change-plan for small fullstack changes.
---

# Feat Spec

**Framework versions:** Use Nuxt 4 for Nuxt work. When Vuetify is involved, use Vuetify 4. Apply these versions to designs, examples, implementation, and reviews.

Use this skill when the request changes both frontend and backend in the same feature slice, or when frontend delivery depends on a new or changed backend contract.
The feature changes both frontend and backend; the repository decides whether that backend is NestJS or Laravel.
For a small fullstack change — evolving an existing flow or a small new feature — use `change-plan`. This skill is the door for a large new feature; the discriminator is size, not novelty.

If the request is frontend-only, use `nuxt-think`.
If the request is backend-only, use `nestjs-think` or `laravel-think` according to the target repository.

This skill does not replace the platform-specific think skills. Close the shared feature design, ownership boundary, and preliminary contract needed to design the UI. The selected backend skill closes the implementation-ready contract later.

## Planning Path

`doc-domain` → `doc-gherkin` → `nuxt-think` → prototype decision → `nestjs-think` or `laravel-think` → `doc-openapi` when HTTP changes → `fullstack-plan`.

1. Close the domain and Gherkin. Use `nuxt-think` to design the flow from the scenarios, including the data, permissions, transitions, and feedback the UI needs. Keep endpoints, payload formats, and persistence provisional until backend design.
2. Resolve whether to prototype. Follow the user's explicit choice. If the choice is unspecified, ask the user whether to build and review the prototype or proceed with the design and available references. Recommend one based on the scope and wait for the answer. If the user explicitly skips the prototype, record the decision and continue to backend design without a prototype approval step.
3. If the user chooses a prototype, use `nuxt-design` to cover all screens and applicable states of the feature. Present the working demo, the screen and state coverage, and any gaps in browser verification. Wait for explicit user approval before starting backend design. If the user requests changes, update the affected views and ask for approval of that revision. Record the approved reference and the user's decision with the feature artifacts.
4. Inspect the repository and invoke `nestjs-think` or `laravel-think` for the detected backend. Use the closed scenarios and frontend decisions to close transport and persistence viability.
5. Check the backend design against the UI decisions and scenarios. Resolve transport details that preserve visible behavior during the handoff. If the contract requires a change to approved screens, states, permissions, or transitions, update the affected specifications and ask the user to approve the affected prototype again before planning.
6. Publish `openapi.yaml` with `doc-openapi` for new or changed HTTP contracts. For existing HTTP contracts used as-is, cite the existing source. For other integrations, carry the closed event or state contract into the plan. Save the joint plan and stop there unless the user also requested implementation.

Publish each artifact and state the decisions and assumptions made. When waiting for the user's prototype choice or approval, save the current status and reference in the feature's design artifact so the next turn resumes from that point. After the prototype decision and any required prototype approval, continue without another routine approval. Honor any explicit review checkpoint or stopping point.

When handing off to planning, do not introduce **frontend** Playwright/browser E2E as
implied acceptance work; it requires an explicit user request. Backend verification
may use Playwright when appropriate. `typecheck` still requires an explicit request.

## Domain Specification Gate

Before routing to `nuxt-think`:

1. identify the target domain
2. use `doc-domain` to create or update `docs/domain/<domain>/domain.md`
3. use `doc-gherkin` to create or update `docs/domain/<domain>/*.feature`
4. self-review the domain and Gherkin artifacts for consistency with the feature
5. capture the shared data, actions, and constraints the UI needs and mark transport assumptions as provisional
6. close the ownership boundary between frontend and backend
7. close the feature-level states and interactions described in the scenarios
8. do not advance with stale domain or Gherkin artifacts
9. inventory any concrete seed data, catalog keys, criteria text, mappings, and externally approved values required by the feature. Locate the source in the repository or supplied material and cite its path or attachment identifier in the domain artifact. A list of topics or examples does not establish the exact values. If the values are absent, resolve the business choice with the user before calling the specification closed; do not defer it to a planner or tell an implementer to find an unspecified "approved source"

## Shared Decisions

Resolve what affects the domain or the UI before frontend design. Carry remaining technical choices to the selected backend skill.

- target feature slice and owning domain
- preliminary HTTP, event, or state contract shape shared by both sides
- whether the contract should be chunky or batch-oriented rather than chatty
- whether update flows are partial/minimal-payload or full replacement, and what both sides must preserve
- error mapping and user-visible state expectations tied to the contract
- explicit lifecycle states when frontend behavior or backend processing depends on them
- ownership boundary: what frontend owns locally vs what backend owns centrally
- cross-stack naming that both sides should preserve
- backend assumptions the transport contract must preserve

## How To Ask The User

For material discrete decisions, offer concise options through the structured question UI when available, or in text otherwise.

Ask when these decisions remain unresolved:

- contract shape (chunky/batch vs chatty)
- update payload posture (partial vs full replacement)
- ownership of a contested capability (frontend-local vs backend-central)
- where lifecycle state lives (client-derived vs server-authoritative)
- error-mapping posture (transport-level vs domain-shaped errors)

Lead with a recommendation and its trade-off. Use free-form text for genuinely open answers.

Outside the prototype decision and review described above, do not ask for:

- yes/no confirmations of an obvious next step
- plan-approval gates — do not ask for them; continue unless the user explicitly requests a review checkpoint
- requests for prose-level explanations from the user

Hand Nuxt component decomposition, visual direction, and route-level UI structure to `nuxt-think` after Gherkin.
Do not finish framework-specific backend design here. Hand NestJS/Prisma boundaries to `nestjs-think`, or Laravel/Eloquent/Policy/transaction boundaries to `laravel-think`.

## Output

Produce:

- shared domain summary
- generated specification artifacts
- preliminary UI requirements and shared assumptions, followed by the closed contract and its source after backend design
- frontend ownership boundary
- backend ownership boundary
- contract-dependent states and error handling
- frontend decisions, visual references, and the prototype decision
- prototype path, coverage, and approval status when a prototype is requested
- detected backend, and path and delivery summary of the saved joint `fullstack-plan`
