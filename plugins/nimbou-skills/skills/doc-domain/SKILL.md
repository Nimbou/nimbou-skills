---
name: doc-domain
description: Use when a backend or Nuxt feature needs one framework-neutral business-domain map of terms, states, transitions, invariants, and derived statuses before planning or test generation.
---

# Doc Domain

## Purpose

Create or update `docs/domain/<domain>/domain.md` as the shared source of truth for domain terms, entities, states, transitions, and derived statuses.

## When to Use

Use this from `nuxt-think`, `nestjs-think`, or `laravel-think` during specification, before any plan is written.

## Output

- `docs/domain/<domain>/domain.md`
- keep the document compact and domain-centered
- prefer business language over framework or database language

## Rules

- support only Claude Code and Codex
- document one domain per run
- write states in `UPPER_CASE`
- keep derived statuses separate from real states
- do not include Eloquent/Prisma models, DTO fields, HTTP routes, or class names
