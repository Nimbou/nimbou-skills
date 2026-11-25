---
name: change-plan
description: Use when a small change or bugfix touches both a NestJS or Laravel backend and the Nuxt frontend, for an existing flow or a small new feature.
---

# Change Plan

**Required:** Read and apply [Required scope and delivery summary](../fullstack-plan/scope-summary.md) before writing tasks and during self-review. Include its complete delivery summary in the saved plan and final chat response.

**Framework versions:** Use Nuxt 4 for Nuxt work. When Vuetify is involved, use Vuetify 4. Apply these versions to designs, examples, implementation, and reviews.

## Overview

Single entry point for a **small** fullstack change (NestJS or Laravel + Nuxt). Detect the backend from the repository before selecting platform rules. When the work is small, this skill produces one wave-structured plan for `executing-plans`, with no domain-artifact gate. Its tasks still declare `Estimativa` so the executor can choose setup-sharing only for short work. When a size threshold trips, route to the full specification path.

This skill **replaces `change-spec`**. It covers what `change-spec` covered (evolving an existing flow) and, additionally, small new features that span both stacks.

**Core principle:** size decides everything. Small → emit the plan here. Big → escalate.

## When to Use

- A bugfix or small implementation that touches backend and frontend of an existing flow.
- A small new feature that spans both stacks.

Do **not** use when:

- The work touches one stack only → the detected `nimbou-skills:nestjs-think` / `nimbou-skills:laravel-think`, or `nimbou-skills:nuxt-think`.
- The change is big (see Routing Gate) → escalate; do not force it through here.

## Routing Gate

Inspect the current code path and impact before designing the change. Resolve material scope ambiguities and run the threshold. Assess HTTP complexity from the existing contract and expected impact. Close the actual contract after frontend design and any prototype review.

Escalate if **ANY** signal trips:

1. **Migration with backfill or multi-step** (expand → migrate → contract). A single additive migration (new nullable column, new table) stays.
2. **> 8 files written, or > 2 roles per stack.**
3. **A real contract dependency forces an extra implementation wave** — the work does not fit the flat default wave shape.
4. **The HTTP contract does not close inline in one pass** — several new endpoints, or an unstable contract that needs iteration.

**Escalate only when a signal trips.** A new feature is not a reason to escalate — a small new feature stays here (see Boundary with feat-spec). Once a signal has tripped, pick the target by novelty, never by re-judging size:

- **New feature** → `nimbou-skills:feat-spec`.
- **Evolving an existing flow** → follow the [full specification planning path](../feat-spec/SKILL.md#planning-path) for the affected flow. Close the domain and Gherkin, then run `nuxt-think` and resolve the prototype before the detected backend think skill. Use `doc-openapi` if the HTTP contract changes and finish with `fullstack-plan`.

If nothing trips, use the small-change workflow below. If a later escalation preserves the same visible behavior, carry forward the recorded prototype decision and any approval. Revisit only changes to the approved experience.

## Boundary with feat-spec

The discriminator is **size only**. Anything small — new or existing — is `change-plan`. `feat-spec` is the door for a **large new feature**. Do not ask "is it new enough?"; ask "does a threshold signal trip?".

## Small-change workflow

`nuxt-think` → prototype decision → lightweight backend design → saved plan.

1. Use the small `change-plan` path of `nuxt-think` to design the affected screens and states from the existing flow and inline acceptance cases. Keep transport assumptions provisional.
2. Follow the user's explicit prototype choice. If the choice is unspecified, ask the user whether to prototype the change or proceed with the design and available references. Recommend a path based on the visible impact and wait for the answer. If the user explicitly skips the prototype, record the choice and continue to backend design with the frontend decisions and available references.
3. If a prototype is chosen, use the [Nuxt Design prototype workflow](../nuxt-design/SKILL.md#prototype-for-fullstack-planning) for every affected screen and applicable state of the change. Show the runnable demo and coverage. Wait for explicit user approval before starting backend design. Record the approved revision when the user approves it.
4. Close the lightweight backend design using the detected stack's rules and reconcile its contract with the frontend decisions. If a change affects approved states, actions, or permissions, revise the affected prototype and get approval of that revision. Document new or changed HTTP behavior in an **inline contract block** with the route, request and response, and error cases. Reuse existing contract sources where applicable.

Before waiting for a prototype choice or approval, save the design notes, current decision or pending status, and any available reference so the next turn can resume.

## Producing the Plan

After the small-change design closes, follow **REQUIRED SUB-SKILL:** `change-plan/plan-generation.md`. It writes an `executing-plans`-ready plan to `docs/plans/<slug>/doc.md` and defers platform rules to `fullstack-plan`, the detected backend planner, and `nuxt-plan`.

Save the plan and stop there unless the user also requested implementation. When implementation is requested, use the planning and execution-task handoff in `../executing-plans/plan-session-handoff.md`.

## Integration

- **Replaces** `change-spec`.
- Downstream (small): `nimbou-skills:executing-plans` consume the plan directly.
- Escalation: use the full specification path under `Routing Gate` and carry the frontend decisions and any approved prototype into `nimbou-skills:fullstack-plan`.
