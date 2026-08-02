# nimbou-skills

## Purpose

This repository is a local fork that is being repurposed into a skill library focused on `NestJS`, `Prisma`, `Clean Architecture`, and `SOLID` principles.

It is not an upstream mirror and it is not meant to preserve upstream contribution rules.

## Working Rules

1. Keep support limited to `Claude Code` and `Codex` unless explicitly expanded.
2. Prefer removing upstream-specific surface area over carrying compatibility baggage.
3. Treat skill content as behavior-shaping code. Edit it deliberately and keep references coherent.
4. Keep generated artifacts and planning output under `docs/plans/` unless the user asks otherwise.
5. Avoid introducing third-party harness integrations, marketplace metadata, or docs that the fork does not actively support.

## Editing Expectations

- Preserve the workflow core unless the user asks to replace it.
- When changing skill names or paths, update all cross-references in the kept skill set.
- `plugins/nimbou-skills/workflows/` holds Claude Code dynamic workflows. Codex does not run them, so every workflow needs a prose counterpart that works end to end.
- When a skill has both, split it: `SKILL.md` keeps the conversational gate and the routing decision, and the executable body moves to a sibling file (see `executing-plans/prose-execution.md`). Leaving both an executable prose path and a workflow inside one `SKILL.md` means the prose wins by default and the workflow never runs.
- The prose file stays normative for both harnesses. A workflow that disagrees with it is the bug, not the other way round.
- Prefer concise, implementation-oriented wording over community or marketing language.
- If a future change is specific to NestJS, Prisma, architecture boundaries, testing strategy, or review workflow, it belongs here.

## Review Discipline

- Show the user the effective diff before any publish or PR step.
- Do not assume this repo should sync back upstream.
- If a change breaks Claude or Codex bootstrap, stop and fix that before moving on.
