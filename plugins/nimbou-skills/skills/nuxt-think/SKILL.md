---
name: nuxt-think
description: Explore uma feature Nuxt/Vuetify antes de planejar ou codar, ou defina e audite decisões de um design system, incluindo tokens, variantes, estados e consumidores afetados.
---

# Nuxt Think

**Framework versions:** Use Nuxt 4 for Nuxt work. When Vuetify is involved, use Vuetify 4. Apply these versions to designs, examples, implementation, and reviews.

## Choose the workflow

- **Feature or flow:** follow the existing feature design process below. For an isolated visual prototype, use `nimbou-skills:nuxt-design`.
- **Shared design system:** read [Design system decisions](reference/design-system.md) when the request involves starting or auditing the system, or changing a shared token or component. For a system-only request, return the design decisions or audit findings. Use the domain specification gate and planning handoff when there is a feature to plan.

## Purpose

Clarify what to build before frontend implementation. Consult `components.meta.json` when it exists, or `.generated/component-catalog/components.meta.json` when the project ships the slim catalog mirror, ask only the minimum useful questions, and challenge weak component boundaries.

Use this skill instead of `nestjs-think` when the request is clearly Nuxt/Vuetify-first.
Use `feat-spec` when the request changes both frontend and backend or depends on a new backend contract.
Use `change-plan` when a small change or bugfix touches both frontend and backend (existing flow or a small new feature).

This skill owns discovery and design closure for frontend work. Resolve UI structure, reuse choices, state ownership, user interactions, and responsive behavior here so `nuxt-plan` can stay focused on execution topology.

Before closing decisions, locate the nearest `DESIGN.md` and `GUIDELINES.md` in the target project for the feature area you are shaping. Start from the likely ownership directory for the route, page, or domain component, then walk upward. Prefer the closest file. In a monorepo, the relevant app-level files are the default baseline and a closer feature-level file can override them.

When design choices involve HTML/CSS, browser APIs, accessibility, or browser support, consult `nimbou-skills:modern-web-guidance` before closing those choices. Record the applicable guide IDs and compatibility/fallback decisions for implementation; preserve local wrappers and this skill's design-only scope. Reuse guides already read for the same task instead of repeating searches.

## Domain Specification Gate

Apply this gate during step 6 of `## Flow`, before considering the design step closed. In the small `change-plan` path, use existing behavior and inline acceptance cases for the affected screens, states, and actions. Return those decisions to `change-plan` without requiring domain or OpenAPI artifacts. Escalated changes use the full gate.

Before closing design decisions:

1. identify the target domain
2. confirm `docs/domain/<domain>/domain.md` is closed and internally coherent
3. confirm the relevant `docs/domain/<domain>/*.feature` files are closed and match the domain map
4. in `feat-spec`, design from domain and Gherkin. Record the UI's data, actions, permissions, and outcomes. OpenAPI is not a prerequisite for the prototype. Leave transport details provisional until backend design.
5. when working after backend design and HTTP changes, confirm `docs/domain/<domain>/openapi.yaml` is closed
6. do not redefine the HTTP contract inside `nuxt-think`; consume the closed `openapi.yaml` when available, or cite the existing source for an unchanged contract
7. do not hand off to implementation planning with stale domain, Gherkin, or applicable OpenAPI artifacts

Treat `docs/domain/<domain>/` as the canonical specification bundle for the feature slice. If the request touches multiple independent domains, split them and close one domain at a time.

## Flow

1. Read `components.meta.json` when available. Fall back to `.generated/component-catalog/components.meta.json` when the project exposes only the slim catalog.
2. Read the nearest `DESIGN.md` and `GUIDELINES.md` that apply to the target area in the target project. If one or both do not exist, note that explicitly, continue, and suggest generating or refreshing them with `/craft-setup`.
3. Classify the request as simple, medium, or complex.
4. Search for reusable components by `tags`, `category`, and `domain`. Use `useWhen` only when the rich catalog includes it.
5. Ask focused follow-up questions only when the request still has material ambiguity. For discrete choices, offer concise options through the structured question UI when available, or in text otherwise.
6. Close the design decisions that matter for implementation:
   - what product context affects the implementation posture, such as dense data, keyboard-heavy use, responsive priority, or long-session workflows
   - what screen, route, modal, or dashboard slice owns the work
   - which existing components are reused versus newly created
   - whether the target project already has local wrappers or primitives for forms, tables, dialogs, filters, empty states, feedback, or entity autocompletes that should be preferred over local markup
   - where state should live by locality: child, page, subtree composable, or app-wide store
   - whether communication should use props/emits, `defineModel`, `provide`/`inject`, or Pinia
   - what loading, empty, error, and success states must exist
   - which additional cases apply from the [interface state inventory](reference/interface-states.md), particularly long data, permission changes and concurrent updates
   - what inline feedback or autosave behavior must be observable when the flow edits data in place
   - what user interactions change navigation, filtering, or local state
   - what responsive layout shifts matter
   - what performance constraints matter, such as avoiding duplicated fetch ownership between page and composable or avoiding mirrored watchers
   - what existing primitives, shells, or local patterns from `DESIGN.md` and `GUIDELINES.md` must be preferred
   - what visual direction should guide the UI so it does not drift into generic output
   - what local anti-patterns must be avoided, such as rebuilding an existing shell locally, creating a store for simple parent-child communication, or pushing child-only handlers up into the page
7. For visible UI work in a joint plan, document the visual reference below. In `feat-spec` and `change-plan`, use the prototype decision from the calling workflow before invoking `nuxt-design`. Record the affected screen and state inventory so the decision and review use the same scope.
8. Publish the structured output and its references. Return to `feat-spec` or `change-plan` for the prototype decision and later backend handoff. For other workflows, continue to `nuxt-plan` for frontend-only work or to `fullstack-plan` once joint design and contract are closed. Do not write production code during this step. Outside the specified prototype decision and review, pause only for an explicit review checkpoint or a material decision that cannot be resolved from the request and repository.

Consult `nimbou-skills:nuxt-design-architecture`, the local `GUIDELINES.md`, and the local `DESIGN.md` before proposing component splits. `GUIDELINES.md` owns implementation rules; `DESIGN.md` owns visual rules and wins on visual conflict.

## Visual reference for fullstack work

When `feat-spec` or `change-plan` calls for a prototype, use the [prototype for fullstack planning](../nuxt-design/SKILL.md#prototype-for-fullstack-planning) workflow. In other workflows, if the feature creates a screen or materially changes its composition, use `nimbou-skills:nuxt-design` to build an isolated prototype. When a user-supplied design already covers the requested screen, use it as a reference. Use the app shell, components, and tokens from the closest relevant screens and guides. Settle hierarchy and action placement with `nimbou-skills:nuxt-design-composition`, and use `nimbou-skills:nuxt-design-posture` for feature-specific density and visual treatment.

For a prototype, render at representative desktop and supported narrow widths. Use the [visual critique checklist](../nuxt-audit/reference/visual-critique.md) to inspect the renders, repair issues within scope, and rerender the affected states. Save the prototype and evidence at paths accessible from the execution checkout. If the app preview cannot run, use the standalone HTML preview from `nuxt-design`. If no browser can render the preview, provide the runnable preview and name the states and widths that still need visual verification.

When proceeding without a prototype, use the user-supplied design or an existing visual pattern. Reuse it as the reference and specify the exact route or component, what to preserve, and what changes. If no reference exists, record concrete UI decisions and observable checks in the design artifact for the planner.

Under `### Referência visual`, link the reference and available renders. For each affected screen, describe the order of the main regions, the placement of the primary action and feedback, the shared components to use, and the behavior at each relevant width and state. Write observable checks tied to those decisions. For example, a dense review queue might keep search and status filters in a single toolbar on desktop. At 390 px, search stays in the page, filters open in the existing drawer, and long titles wrap without hiding the row action.

## How To Ask The User

Decisions inside this skill that may use a structured question UI when available:

- which existing component or wrapper to reuse versus creating a new one
- where state lives (child component, page, subtree composable, app-wide store)
- which communication primitive to use (props/emits, `defineModel`, `provide/inject`, Pinia)
- which responsive posture to take when more than one is viable
- which inline-feedback vs toast posture to use when the project supports both

Lead with your recommendation as the first option and append `(Recommended)` to its label. Keep options to 2-4.

Do not use a structured question UI for:

- open naming, copy, or visual-direction prose
- yes/no confirmations of an already-recommended path
- plan-approval gates — do not ask for them; continue unless the user explicitly requests a review checkpoint

## Think Output

### O que construir

Describe the requested page, flow, or component in one sentence.

### Componentes a reutilizar

- `ProjectStatusBadge` - reuse when the request needs project lifecycle display.

### Componentes a criar

- `ProjectDetailsSidebar` - summarize project metadata and actions.

### Composables/Utils/Config

- `useProjectDetails` - keep reactive fetch and transformation logic outside the page component.

### Decisoes tomadas

- Split the header and sidebar because the concerns and reuse surface are different.
- Keep state at the lowest level that serves all consumers; do not invent a store when props/emits or a local composable already solve it.
- Reuse local wrappers for forms, tables, dialogs, empty states, and entity selection before creating equivalent feature-local markup.

### Direcao visual

- State the intended tone in one short line.
- Prefer existing shells, spacing, and primitives from `DESIGN.md` and `GUIDELINES.md` before inventing new presentation patterns.
- Call out any anti-genericity guardrails that matter for this feature, such as density, emphasis, or when to stay visually quiet.
- **RELATED SKILLS:** Use `nimbou-skills:nuxt-design-composition` to frame page hierarchy, hero, and landing vs product UI mode. Use `nimbou-skills:nuxt-design-posture` to close micro aesthetic details (fonts, color tokens, CSS bans). Use `nimbou-skills:nuxt-design-architecture` to frame component tiers, SOLID boundaries, extraction rules, and communication contracts. Local `GUIDELINES.md` owns implementation constraints; local `DESIGN.md` still wins on visual conflict.

### Estados e interacoes

- Loading: show skeletons in the main content area.
- Empty: show a neutral empty state when no records exist.
- Error: show inline retry feedback near the failing block.
- Success: prefer inline confirmation when the action is local and obvious; avoid redundant toast noise when the UI already proves success.
- Interaction: sidebar actions trigger navigation and local refresh only.

### Responsividade

- Collapse the sidebar below tablet width.
- Preserve the header summary above the content stack on mobile.
- Preserve scanability for dense or tabular flows before optimizing decorative layout moves.

### Pronto para planejar

In the initial `feat-spec` or `change-plan` pass, report readiness for the prototype decision. Apply the planning checks below after the backend handoff, using inline acceptance cases and contract sources for small changes.

- Route ownership, reuse decisions, state behavior, and responsive behavior are closed.
- `docs/domain/<domain>/domain.md` closed.
- `docs/domain/<domain>/*.feature` closed.
- `docs/domain/<domain>/openapi.yaml` closed when the feature changes HTTP. In `feat-spec`, check this at the final planning handoff after backend design.
- The relevant `DESIGN.md` and `GUIDELINES.md` constraints are closed.
- The applicable planner turns the design into exact file paths and execution waves.
