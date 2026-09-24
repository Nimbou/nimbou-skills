# nimbou-skills

## Purpose

This repository is a local fork that is being repurposed into a skill library focused on `NestJS`, `Prisma`, `Clean Architecture`, and `SOLID` principles.

It is not an upstream mirror and it is not meant to preserve upstream contribution rules.

## Working Rules

1. Keep support limited to `Codex` unless explicitly expanded.
2. Prefer removing upstream-specific surface area over carrying compatibility baggage.
3. Treat skill content as behavior-shaping code. Edit it deliberately and keep references coherent.
4. Keep generated artifacts and planning output under `docs/plans/` unless the user asks otherwise.
5. Avoid introducing third-party harness integrations, marketplace metadata, or docs that the fork does not actively support.

## Model Ceiling

- The highest model tier this library may recommend or dispatch is `gpt-6-sol`, with at most `medium` reasoning.
- Use `gpt-6-sol`/`medium` for open design decisions, behavioral implementation, and substantive review. Use `gpt-6-luna`/`high` for bounded mechanical work with a closed contract; never set Luna below `high`.
- Do not use `gpt-6-astra` or set Sol above `medium`. Split or clarify work that does not fit within these bounds.
- Preserve a user's explicit choice when it meets these bounds. These rules guide future task creation and delegation; they do not change the current task's model setting.

## Editing Expectations

- Preserve the workflow core unless the user asks to replace it.
- When changing skill names or paths, update all cross-references in the kept skill set.
- `executing-plans/prose-execution.md` holds the executable Codex path.
- Keep `executing-plans/SKILL.md` as the conversational gate and `executing-plans/prose-execution.md` as its execution body.
- The prose file is normative for plan execution.
- Prefer concise, implementation-oriented wording over community or marketing language.
- If a future change is specific to NestJS, Prisma, architecture boundaries, testing strategy, or review workflow, it belongs here.

## Review Discipline

- Show the user the effective diff before any publish or PR step.
- Do not assume this repo should sync back upstream.
- If a change breaks Codex bootstrap, stop and fix that before moving on.
