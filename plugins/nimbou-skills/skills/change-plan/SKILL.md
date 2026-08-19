---
name: change-plan
description: Use when a small change or bugfix touches both the NestJS backend and the Nuxt frontend — evolving an existing flow or a small new feature — and running change-spec then fullstack-plan would be two steps for little work.
---

# Change Plan

## Overview

Single entry point for a **small** fullstack change (NestJS + Nuxt). When the work is small, this skill produces one wave-structured plan that `run-waves`/`executing-plans` runs directly — no separate spec step, no domain-artifact gate. When the work is not small, it routes to the heavier path instead of under-planning it.

This skill **replaces `change-spec`**. It covers what `change-spec` covered (evolving an existing flow) and, additionally, small new features that span both stacks.

**Core principle:** size decides everything. Small → emit the plan here. Big → escalate.

## When to Use

- A bugfix or small implementation that touches backend and frontend of an existing flow.
- A small new feature that spans both stacks.

Do **not** use when:

- The work touches one stack only → `nimbou-skills:nestjs-think` or `nimbou-skills:nuxt-think`.
- The change is big (see Routing Gate) → escalate; do not force it through here.

## Routing Gate

Inspect the current code path and impact **before** writing anything. Ask the user only when the ambiguity is material and cannot be closed from the code. Then run the threshold.

Escalate if **ANY** signal trips:

1. **Migration with backfill or multi-step** (expand → migrate → contract). A single additive migration (new nullable column, new table) stays.
2. **> 8 files written, or > 2 roles per stack.**
3. **A real contract dependency forces an extra implementation wave** — the work does not fit the flat default wave shape.
4. **The HTTP contract does not close inline in one pass** — several new endpoints, or an unstable contract that needs iteration.

**Escalate only when a signal trips.** A new feature is not a reason to escalate — a small new feature stays here (see Boundary with feat-spec). Once a signal has tripped, pick the target by novelty, never by re-judging size:

- **New feature** → `nimbou-skills:feat-spec` (it runs the domain gate, then `fullstack-plan`).
- **Evolving an existing flow** → close the contract with `nimbou-skills:nestjs-think` + `nimbou-skills:nuxt-think`, then `nimbou-skills:fullstack-plan`.

If nothing trips, stay and produce the plan — new or existing alike.

## Boundary with feat-spec

The discriminator is **size only**. Anything small — new or existing — is `change-plan`. `feat-spec` is the door for a **large new feature**. Do not ask "is it new enough?"; ask "does a threshold signal trip?".

## HTTP Contract Gate

No domain artifacts are required. The **only** gate: when the change alters the HTTP contract, the plan carries an **inline contract block** (route + request/response payload + error cases) — never an `openapi.yaml`. When HTTP does not change, skip it.

## Producing the Plan

Once the gate says "stay," follow **REQUIRED SUB-SKILL:** `change-plan/plan-generation.md`. It writes a `run-waves`-ready plan to `docs/plans/change-plan-<slug>.md` and defers all platform and wave rules to `fullstack-plan`, `nestjs-plan`, and `nuxt-plan`.

## Integration

- **Replaces** `change-spec`.
- Downstream (small): `nimbou-skills:executing-plans` / `run-waves` consume the plan directly.
- Escalation: `nimbou-skills:feat-spec` (new) or `nimbou-skills:nestjs-think` / `nimbou-skills:nuxt-think` → `nimbou-skills:fullstack-plan` (existing).
