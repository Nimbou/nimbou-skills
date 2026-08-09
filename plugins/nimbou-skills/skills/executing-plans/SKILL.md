---
name: executing-plans
description: Use when you have an approved wave-structured plan and want it executed wave by wave, fanning each wave's tasks out to parallel implementer subagents, committing once per wave, and running spec compliance review as a non-blocking subagent whose findings feed an end-of-plan follow-ups artifact.
---

# Executing Plans

## Overview

Load the plan, review it critically, confirm it is wave-structured, then hand it to an executor. Inside a wave, one implementer subagent runs per task, in parallel — nobody writes the whole wave sequentially. Each wave is committed as soon as its tasks land and verify. Every task is driven by its own failing test, and the red run is reported as evidence. Two **non-blocking** reviewers run once at the end — spec compliance against the plan, and a boundary lens over the diff; their findings never gate progression, they accumulate into `<plan>.followups.md`. Those follow-ups are then executed, not just filed. Last, when the plan touched frontend files, a browser smoke verifies the promised flows on screen. Full code review is deliberately **not** part of this skill: run `/code-review` over the branch when the change warrants a further pass.

Parallelism only happens within a wave, exactly as the plan declares it. Waves stay sequential because later waves consume contracts earlier waves produce. Reviews run alongside execution, not in front of it.

**Why fan out:** `nestjs-plan` and `nuxt-plan` already guarantee that tasks inside a wave are parallel-safe — no shared file writes, no implicit ordering. Implementing them one after another throws that guarantee away and pays wave time proportional to the task count. It also drags every task's diff and verification output through a single context, which degrades the controller across long plans.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

## Routing: where the run actually happens

**This file is a router. It owns Step 1 and nothing else executable.** The body of
the run — the per-task fan-out, the per-wave commit, the spec review, the follow-ups,
the browser smoke — lives in `./prose-execution.md` and in the `run-waves` workflow. The split is
deliberate: with an executable prose path and a workflow in the same document, the
prose wins by default and the workflow never runs. Pick one, in this order:

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
- mechanical steps (parse, commit, follow-ups artifact) run on a small model at low
  effort, and implementers get their spec as a line range into the plan rather than
  as re-emitted prose — both are cost decisions a hand-walked prose run will not make

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
7. Establish the checkout. Run `git rev-parse --show-toplevel`, `git rev-parse --abbrev-ref HEAD`, and `git worktree list`, and state the path, the branch, and the sibling checkouts in your opening message. **Refuse to implement on a long-lived branch** — `main`, `master`, `dev`, `develop`, `staging`, `production` — without explicit user consent: a run sitting on one is almost always the main checkout instead of the worktree set up for this plan. That absolute path is `WORKTREE_ROOT` — every implementer, commit, and reviewer in the run is anchored to it, because subagents do not reliably inherit a working directory and plans often write their paths as absolute. Both paths do this: the workflow re-derives it in its parse step, the prose path in Step 2.0.
8. Create TodoWrite (one entry per wave, plus one entry per task inside each wave, plus the post-wave commit, plus a single "collect spec review" entry, plus Step 3) and proceed only when the plan is executable.

## Boundary

Use this skill for full plan execution from an approved, wave-structured plan, when reviews should be advisory rather than gating.

Do not use it just because parallel work exists. If the real need is "split N unrelated failures across N agents" with no plan behind it, use `nimbou-skills:dispatching-parallel-agents` instead.

## When to Stop

Stop immediately when:

- an implementer subagent reports a blocker it could not resolve
- the plan has critical gaps
- an instruction is unclear
- a verification fails repeatedly
- a wave encounters a failure that invalidates downstream waves
- a file an implementer reported writing shows no change in `WORKTREE_ROOT` — the wave is fractured across two checkouts and must not be committed in part

Reviewer findings — including ❌ from either reviewer — do **not** stop execution. They go to follow-ups and are surfaced to the user at completion.

Ask for clarification instead of guessing.

## When to Revisit Review

Return to Step 1 when:

- the user updates the plan
- the approach needs rethinking
- a blocker shows the plan is incomplete or inconsistent

## Remember

These are this file's rules. The per-wave mechanics — fan-out, write-set grouping,
commit-per-wave, end-of-plan spec review, follow-up execution — belong to
`./prose-execution.md` and are not restated here.

- review the plan critically first — Step 1 is this file's only executable content
- anchor the run to one absolute checkout before dispatching anything, and stop a wave whose reported files are not in it
- wave mode only — refuse plans without `## Ondas de Execução`
- on Claude Code, delegate Steps 2-5 to `/nimbou-skills:run-waves`; walk `./prose-execution.md` by hand only when workflows are unavailable, and announce it
- never let reviewer output gate a wave — findings feed `<plan>.followups.md`; full code review is `/code-review` over the branch, not part of this skill
- close a frontend-touching run with the browser smoke — a skipped smoke is reported as a gap, never as a pass
- run `nestjs-test` as the final wave when the plan came from `nestjs-plan`, scoped strictly to the files this plan changed (explicit suite paths only — never an unfiltered `pnpm test`)
- stop when blocked by implementation, not by reviewer output
- do not start implementation on a long-lived branch (`main`, `master`, `dev`, `develop`, `staging`, `production`) without explicit user consent — on the workflow path that is a hard stop, overridable with `allowDefaultBranch: true`

## Integration

Required workflow skills:

- `nimbou-skills:using-git-worktrees` — set up an isolated workspace before starting
- `nimbou-skills:nestjs-plan` — produces wave-structured backend plans for this skill to execute
- `nimbou-skills:nuxt-plan` — produces wave-structured frontend plans for this skill to execute
- `nimbou-skills:nestjs-test` — REQUIRED final wave when the plan came from `nestjs-plan`, scoped strictly to the files this plan changed (no full-suite runs)
- `nimbou-skills:browser-smoke` — Step 5, in `report` mode, when the committed diff touched frontend files. The only lens here that looks at the running application; it skips itself cleanly when no browser driver is available

Execution body — see Routing above for which one applies:

- `./prose-execution.md` — Steps 2-5, normative.
- `/nimbou-skills:run-waves` — the same Steps 2-5 as a script. The default on Claude Code.

Local templates, used by both paths:

- `./implementer-prompt.md` — per-task implementer subagent prompt, dispatched in parallel inside a wave
- `./spec-reviewer-prompt.md` — spec compliance reviewer prompt (one subagent at the end of the run, over every committed wave)
- `./followups-template.md` — skeleton for `<plan>.followups.md`

## Output Discipline

When execution completes or stops, report:

- which waves were executed and committed, and how many implementer subagents ran in each
- what each reviewer returned (✅ / ❌ / ⚠️ Deferred), attributed per wave
- that every task reported a red run, or which ones did not
- which lenses ran (red runs, spec compliance, boundaries, browser smoke), so the user can judge whether `/code-review` over the branch is worth it before merging
- the browser smoke's verdict when the plan touched frontend: driver used, flows exercised, what failed on screen, or why it was skipped
- what failed or remains blocked, and whether the failure belongs to one task, one file, or one wave
- whether `<plan>.followups.md` was generated, where it lives, and whether it carries `spec-issue` entries the user should look at
