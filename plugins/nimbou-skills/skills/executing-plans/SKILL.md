---
name: executing-plans
description: Use when you have an approved wave-structured plan and want it executed wave by wave, fanning each wave's tasks out to parallel implementer subagents, committing once per wave, and running spec compliance and code review as non-blocking subagents whose findings feed an end-of-plan follow-ups artifact.
---

# Executing Plans

## Overview

Load the plan, review it critically, confirm it is wave-structured, then hand it to an executor. Inside a wave, one implementer subagent runs per task, in parallel — nobody writes the whole wave sequentially. Each wave is committed as soon as its tasks land and verify. The spec compliance review and the code review run as **non-blocking subagents** — their findings never gate task or wave progression; they accumulate into `<plan>.followups.md` at the end.

**This skill owns Step 1 only.** Steps 2 through 4 live in `./prose-execution.md` (Codex, and Claude Code without workflows) and in `/nimbou-skills:run-waves` (Claude Code). Keeping the executable body out of this file is deliberate: with both an old prose path and a workflow in the same document, the prose is what gets followed by default, and the workflow never runs.

Parallelism only happens within a wave, exactly as the plan declares it. Waves stay sequential because later waves consume contracts earlier waves produce. Reviews run alongside execution, not in front of it.

**Why fan out:** `nestjs-plan` and `nuxt-plan` already guarantee that tasks inside a wave are parallel-safe — no shared file writes, no implicit ordering. Implementing them one after another throws that guarantee away and pays wave time proportional to the task count. It also drags every task's diff and verification output through a single context, which degrades the controller across long plans.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

Use this skill when you have an approved plan to execute end to end and reviews should be advisory rather than gating.

## Routing: where the run actually happens

This file is a **router**. It owns Step 1 and nothing else executable. The body of
the run — the per-task fan-out, the per-wave commit, the reviewers, the follow-ups —
lives in `./prose-execution.md` and in the `run-waves` workflow. Pick one, in this
order:

**Claude Code — use the workflow.** Once Step 1 is done, launch:

```
/nimbou-skills:run-waves docs/plans/<plan>.md
```

Then read the returned report and surface it per Output Discipline below. Do **not**
walk `./prose-execution.md` turn by turn when the workflow is available — that is the
slow path, and running it by hand is the mistake this split exists to prevent.

**Codex — follow `./prose-execution.md`.** Codex does not run workflows. The prose
path is complete and end to end there.

**Claude Code without workflows — follow `./prose-execution.md`, and say so.** Dynamic
workflows can be off: disabled in `/config`, `disableWorkflows` in settings, turned off
org-wide in managed settings, or a Claude Code older than v2.1.154. Announce that you
are on the prose path before starting, so the slower run is a visible choice rather
than a silent regression.

`./prose-execution.md` is **normative**. `workflows/run-waves.js` mirrors it; when the
two disagree, the prose file wins and the workflow is the bug.

### What the workflow gets you

- task results stay in script variables instead of the controller's context
- a stopped run resumes without re-running completed tasks
- the orchestration is a file you can read, diff, and rerun

### What the workflow cannot do

It enforces the structural guards on its own — it still refuses a plan without
`## Ondas de Execução`, and still adds the final `nestjs-test` wave when a
`nestjs-plan` forgot to declare one, recording that as a `concern`.

What it cannot do is Step 1's judgement: spotting a missing assumption, a
contradiction between two waves, or a requirement the plan never covered. A workflow
takes no user input mid-run, so there is nobody to raise it to. **Step 1 always runs
here, in conversation, first.**

## Step 1: Load and Review

1. Read the plan file
2. Review it critically
3. Raise any blockers or missing assumptions before starting
4. Confirm wave structure: the plan must contain `## Ondas de Execução` (or the legacy `## Grupos de Execucao`). If it does not, **stop** and ask the plan author to regenerate the plan via `nimbou-skills:nestjs-plan` or `nimbou-skills:nuxt-plan`. Do not fall back to a serial task list.
5. Detect plan origin: if the header references `nestjs-plan` or the plan path matches a backend slice, the final wave MUST run `nimbou-skills:nestjs-test` scoped strictly to the files the plan touched. Add the dispatch to TodoWrite if the plan author forgot it. Never let the final wave widen into an unfiltered `pnpm test` run.
6. Detect `## Pos-execucao` (typical for `nuxt-plan` output). Capture those items now to seed the follow-ups artifact in Step 3.
7. Create TodoWrite (one entry per wave, plus one entry per task inside each wave, plus the post-wave commit, plus a single "collect background review results" entry, plus Step 3) and proceed only when the plan is executable.

## Boundary

Use this skill for full plan execution from an approved, wave-structured plan, when reviews should be advisory.

Do not use it just because parallel work exists. If the real need is "split N unrelated failures across N agents" with no plan behind it, use `nimbou-skills:dispatching-parallel-agents` instead.

Do not use it on a plan that lacks `## Ondas de Execução` — refuse and request a wave-structured plan.

## When to Stop

Stop immediately when:

- an implementer subagent reports a blocker it could not resolve
- the plan has critical gaps
- an instruction is unclear
- a verification fails repeatedly
- a wave encounters a failure that invalidates downstream waves

Reviewer findings — including ❌ from the spec reviewer or Critical from the code reviewer — do **not** stop execution. They go to follow-ups and are surfaced to the user at completion.

Ask for clarification instead of guessing.

## When to Revisit Review

Return to Step 1 when:

- the user updates the plan
- the approach needs rethinking
- a blocker shows the plan is incomplete or inconsistent

## Remember

- review the plan critically first — Step 1 is this file's only executable content
- on Claude Code, delegate Steps 2-4 to `/nimbou-skills:run-waves`; walk `./prose-execution.md` by hand only when workflows are unavailable, and announce it
- wave mode only — refuse plans without `## Ondas de Execução`
- fan each wave's tasks out to parallel implementer subagents; the controller orchestrates and commits, it does not implement
- check write sets before fanning out — tasks sharing a file go to one implementer, not two
- commit once per wave, as soon as its tasks land and verify; do not wait for reviewers
- dispatch the spec reviewer and the code reviewer as background subagents per wave (run_in_background)
- never let reviewer output gate the next wave — findings feed `<plan>.followups.md`
- run `nestjs-test` as the final wave when the plan came from `nestjs-plan`, scoped strictly to the files this plan changed (explicit suite paths only — never an unfiltered `pnpm test`)
- collect every background reviewer's result before producing follow-ups
- generate `<plan>.followups.md` only when there are deferred items
- execute **all** follow-ups before declaring completion, grouped by file and dispatched in parallel — manual items go to the output, not to the file
- stop when blocked by implementation, not by reviewer output
- do not start implementation on `main` or `master` without explicit user consent

## Integration

Required workflow skills:

- `nimbou-skills:using-git-worktrees` — set up an isolated workspace before starting
- `nimbou-skills:nestjs-plan` — produces wave-structured backend plans for this skill to execute
- `nimbou-skills:nuxt-plan` — produces wave-structured frontend plans for this skill to execute
- `nimbou-skills:request-review` — REQUIRED: dispatched as a background subagent after every wave's commit
- `nimbou-skills:nestjs-test` — REQUIRED final wave when the plan came from `nestjs-plan`, scoped strictly to the files this plan changed (no full-suite runs)

Execution body:

- `./prose-execution.md` — Steps 2-4, normative. Followed by Codex always, and by Claude Code when workflows are unavailable.
- `/nimbou-skills:run-waves` — Claude Code workflow running the same Steps 2-4 as a script. The default on Claude Code.

Local templates, used by both paths:

- `./implementer-prompt.md` — per-task implementer subagent prompt, dispatched in parallel inside a wave
- `./spec-reviewer-prompt.md` — per-wave spec compliance reviewer prompt (dispatched as a background subagent)
- `./followups-template.md` — skeleton for `<plan>.followups.md`

## Output Discipline

When execution completes or stops, report:

- which waves were executed and committed, and how many implementer subagents ran in each
- what each per-wave spec reviewer subagent returned (✅ / ❌ / ⚠️ Deferred), per wave
- what each per-wave code reviewer subagent returned (Critical/Important/Minor counts), per wave
- what failed or remains blocked, and whether the failure belongs to one task, one file, or one wave
- whether `<plan>.followups.md` was generated, where it lives, and whether it carries `review-critical` or `spec-issue` entries the user should look at
