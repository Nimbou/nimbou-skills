---
name: executing-plans
description: Use when you have an approved wave-structured plan and want it executed wave by wave with one commit per wave and an end-of-plan follow-ups artifact.
---

# Executing Plans

## Expensive-check policy

Do not create or execute **frontend** Playwright/browser E2E coverage unless the user
explicitly requested that work. Backend verification may use Playwright when the plan
calls for it. Do not run `typecheck` unless the user explicitly requested it. Treat a
frontend command copied from a plan or template as insufficient authorization: if the
plan does not record the explicit request, omit it and report it as intentionally
skipped.

This restriction applies to persistent project E2E coverage, not to the ephemeral
`browser-smoke` driver. That skill may use Playwright as its final automatic fallback.

## Overview

Load the plan, review it critically, and execute its waves in order. Use parallel implementer subagents only when the user explicitly authorized multi-agent work; otherwise run each task in the current task. Each wave is committed as soon as its tasks land and verify. Every task is driven by its own failing test, and the red run is reported as evidence. Spec compliance and boundary review run once at the end; findings accumulate into `<plan>.followups.md` and are then executed. When the plan touched frontend files, a browser smoke verifies the promised flows on screen. Full code review is a separate pass over the branch when the change warrants it.

When authorized, parallelism only happens within a wave, exactly as the plan declares it. Waves stay sequential because later waves consume contracts earlier waves produce.

**Why fan out:** `nestjs-plan`, `laravel-plan`, and `nuxt-plan` guarantee that tasks inside a wave are parallel-safe — no shared file writes, no implicit ordering.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

## Routing: Codex execution

This file owns Step 1. After reviewing the plan, follow `./prose-execution.md`
for Steps 2-5. That file is the normative execution path.

## Step 1: Load and Review

1. Read the plan file
2. Review it critically
3. Before dispatching any wave, reconcile the plan against repository evidence:
   - Check exact data sources for seed tasks.
   - Trace changed contracts through writers, readers, projections, synchronizers, serializers, and tests.
   - Map each action in the domain scenarios and task checklists to its existing entrypoints and scoped tests. Check update and submission separately unless a shared validation path is proven. Compare every required edit with task `Files`.
   - Compare domain invariants, OpenAPI types and formats, schema fields, and the actual values each planned migration/backfill will write. For snapshots and audit history, identify storage and retrieval of the value as of each revision. For generated IDs, check the concrete representation against the API format; 32 hex characters do not satisfy `format: uuid`.
   - For each changed Prisma relation, inspect both models, including inverse fields in split schema files.
   Repair deterministic omissions in the plan yourself (tasks, `Files`, `Consome`, waves, and scoped tests), then repeat the review. Ask the user only for a missing business source or a choice that cannot be derived from the approved artifacts and repository. A missing file in a task is not itself a new approval gate.
4. Confirm wave structure: the plan must contain `## Ondas de Execução` (or the legacy `## Grupos de Execucao`). If it does not, **stop** and ask the plan author to regenerate it via `nimbou-skills:nestjs-plan`, `nimbou-skills:laravel-plan`, `nimbou-skills:nuxt-plan`, or `nimbou-skills:fullstack-plan`. Do not fall back to a serial task list.
5. Detect plan origin from the explicit planner named in the header, never from a generic “backend” path. A `nestjs-plan` MUST finish with scoped `nimbou-skills:nestjs-test`; never widen it into an unfiltered `pnpm test`. A `laravel-plan` MUST execute its declared scoped Laravel verification wave and MUST NOT receive `nestjs-test`.
6. Detect `## Pos-execucao` (typical for `nuxt-plan` output). Capture those items now to seed the follow-ups artifact in Step 3.
7. Establish the checkout. Run `git rev-parse --show-toplevel`, `git rev-parse --abbrev-ref HEAD`, and `git worktree list`, and state the path, the branch, and the sibling checkouts in your opening message. **Refuse to implement on a long-lived branch** — `main`, `master`, `dev`, `develop`, `staging`, `production` — without explicit user consent: a run sitting on one is almost always the main checkout instead of the worktree set up for this plan. That absolute path is `WORKTREE_ROOT` — every implementer, commit, and reviewer in the run is anchored to it, because subagents do not reliably inherit a working directory and plans often write their paths as absolute. Both paths do this: the workflow re-derives it in its parse step, the prose path in Step 2.0.
8. Create one progress entry per wave, its tasks, the post-wave commit, review collection, and follow-ups using the harness's native plan tracker when available. If none exists, keep that checklist in the controller's run report. Proceed only when the plan is executable.

Record the Step 1 reconciliation in the opening report with concrete artifact/file references, including any checklist action whose coverage depends on a shared path. A list of task titles or a passing schema validator alone does not prove behavior coverage, retention of revision history, or a backfill's output format.

## Boundary

Use this skill for full plan execution from an approved, wave-structured plan, when reviews should be advisory rather than gating.

Do not use it just because parallel work exists. If the real need is "split N unrelated failures across N agents" with no plan behind it, use `nimbou-skills:dispatching-parallel-agents` instead.

## When to Stop

Stop immediately when:

- an implementer subagent reports a blocker the controller cannot resolve from the approved artifacts and repository
- a critical gap remains after inspecting and repairing the plan and requires an unavailable source or a new business decision
- an instruction remains unclear after checking the approved artifacts and repository
- a verification fails repeatedly
- a wave encounters a failure that invalidates downstream waves
- a file an implementer reported writing shows no change in `WORKTREE_ROOT` — the wave is fractured across two checkouts and must not be committed in part

Reviewer findings — including ❌ from either reviewer — do **not** stop execution. They go to follow-ups and are surfaced to the user at completion.

Ask for clarification when the missing fact is a business decision or unavailable external source. Resolve mechanical scope omissions from repository evidence and update the plan before dispatch.

## When to Revisit Review

Return to Step 1 when:

- the user updates the plan
- the approach needs rethinking
- a blocker shows the plan is incomplete or inconsistent

When the blocker is an omitted integration implied by the closed contract, amend the plan and resume from the affected wave after rechecking its write sets and verification. Resume from the affected wave after the repair; do not treat the stop as a request for user approval.

## Remember

These are this file's rules. The per-wave mechanics — fan-out, write-set grouping,
commit-per-wave, end-of-plan spec review, follow-up execution — belong to
`./prose-execution.md` and are not restated here.

- review the plan critically first — Step 1 is this file's only executable content
- anchor the run to one absolute checkout before dispatching anything, and stop a wave whose reported files are not in it
- wave mode only — refuse plans without `## Ondas de Execução`
- follow `./prose-execution.md` for Steps 2-5
- never let reviewer output gate a wave — findings feed `<plan>.followups.md`; full code review is `/code-review` over the branch, not part of this skill
- close a frontend-touching run with the browser smoke — a skipped smoke is reported as a gap, never as a pass
- run `nestjs-test` as the final wave when the plan came from `nestjs-plan`, scoped strictly to the files this plan changed (explicit suite paths only — never an unfiltered `pnpm test`)
- stop when blocked by implementation, not by reviewer output
- do not start implementation on a long-lived branch (`main`, `master`, `dev`, `develop`, `staging`, `production`) without explicit user consent

## Integration

Required workflow skills:

- `nimbou-skills:using-git-worktrees` — set up an isolated workspace before starting
- `nimbou-skills:nestjs-plan` or `nimbou-skills:laravel-plan` — produces wave-structured backend plans for this skill to execute
- `nimbou-skills:nuxt-plan` — produces wave-structured frontend plans for this skill to execute
- `nimbou-skills:nestjs-test` — REQUIRED final wave when the plan came from `nestjs-plan`, scoped strictly to the files this plan changed (no full-suite runs)
- `nimbou-skills:browser-smoke` — Step 5, in `report` mode, when the committed diff touched frontend files. The only lens here that looks at the running application; in Codex it prefers the integrated browser, then Chrome DevTools MCP, then Playwright as the automatic fallback. It skips itself cleanly only when no driver is available

Execution body: `./prose-execution.md` — Steps 2-5, normative.

Local templates:

- `./implementer-prompt.md` — per-task implementer subagent prompt, dispatched in parallel inside a wave
- `./spec-reviewer-prompt.md` — spec compliance reviewer prompt (one subagent at the end of the run, over every committed wave)
- `./followups-template.md` — skeleton for `<plan>.followups.md`

## Output Discipline

When execution completes or stops, report:

- which waves were executed and committed, and how many implementer subagents ran in each
- the run's total agent count, broken down by phase. Count agents as you dispatch. A plan's task count is not its dispatch count, and the phases after the last wave — two reviewers over every commit, one fixer per file group, the smoke and its own fixes — are invisible from the plan. Report the number so the next plan can be shaped against it
- what each reviewer returned (✅ / ❌ / ⚠️ Deferred), attributed per wave
- that every task reported a red run, or which ones did not
- which lenses ran (red runs, spec compliance, boundaries, browser smoke), so the user can judge whether `/code-review` over the branch is worth it before merging
- the browser smoke's verdict when the plan touched frontend: driver used, flows exercised, what failed on screen, or why it was skipped
- what failed or remains blocked, and whether the failure belongs to one task, one file, or one wave
- whether `<plan>.followups.md` was generated, where it lives, and whether it carries `spec-issue` entries the user should look at
