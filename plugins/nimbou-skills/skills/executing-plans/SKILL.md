---
name: executing-plans
description: Use when you have an approved wave-structured plan and want it executed wave by wave, fanning each wave's tasks out to parallel implementer subagents, committing once per wave, and running spec compliance and code review as non-blocking subagents whose findings feed an end-of-plan follow-ups artifact.
---

# Executing Plans

## Overview

Load the plan, review it critically, confirm it is wave-structured, then execute it onda by onda. Inside a wave, the controller **dispatches one implementer subagent per task and lets them run in parallel** — it does not write the code itself. The controller owns orchestration: briefing, collecting reports, verifying, and committing. Each wave is committed as soon as its tasks land and verify. The spec compliance review and the code review run as **non-blocking subagents** dispatched in background — their findings never gate task or wave progression; they accumulate into `<plan>.followups.md` at the end.

Parallelism only happens within a wave, exactly as the plan declares it. Waves stay sequential because later waves consume contracts earlier waves produce. Reviews run alongside execution, not in front of it.

**Why fan out:** `nestjs-plan` and `nuxt-plan` already guarantee that tasks inside a wave are parallel-safe — no shared file writes, no implicit ordering. A controller implementing them one after another throws that guarantee away and pays wave time proportional to the task count. It also drags every task's diff and verification output through a single context, which degrades the controller across long plans.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

Use this skill when you have an approved plan to execute end to end and reviews should be advisory rather than gating.

## Fast Path: the `execute-plan` workflow

When running under Claude Code with dynamic workflows enabled, Steps 2 through 4 are also packaged as a workflow: `/nimbou-skills:execute-plan`.

It encodes the same contract as a script — per-task fan-out inside each wave, one commit per wave, reviewers dispatched without blocking, follow-ups collected and executed at the end — with three advantages over driving it turn by turn:

- task results stay in script variables instead of the controller's context
- a stopped run resumes without re-running completed tasks
- the orchestration is a file you can read and rerun

Use it like this:

1. Do **Step 1 in this skill, in conversation.** The workflow cannot ask the user anything mid-run, and Step 1 exists precisely to raise blockers and refuse malformed plans.
2. Once the plan is approved and confirmed wave-structured, launch the workflow with the plan path:
   `/nimbou-skills:execute-plan docs/plans/<plan>.md`
3. Read the returned report and surface it per the Output Discipline section below.

The workflow enforces the structural guards on its own, so launching it directly still refuses a plan without `## Ondas de Execução` and still adds the final `nestjs-test` wave when a `nestjs-plan` forgot to declare one — recording that as a `concern`. What it cannot do is Step 1's judgement: spotting a missing assumption, a contradiction between two waves, or a requirement the plan never covered. That is why Step 1 stays in conversation.

Fall back to the prose path (Steps 2-4 executed turn by turn) whenever the workflow is unavailable — Codex, workflows disabled, or a plan small enough that the setup is not worth it. **The prose path is normative.** The workflow mirrors it; when the two disagree, this file wins.

## Step 1: Load and Review

1. Read the plan file
2. Review it critically
3. Raise any blockers or missing assumptions before starting
4. Confirm wave structure: the plan must contain `## Ondas de Execução` (or the legacy `## Grupos de Execucao`). If it does not, **stop** and ask the plan author to regenerate the plan via `nimbou-skills:nestjs-plan` or `nimbou-skills:nuxt-plan`. Do not fall back to a serial task list.
5. Detect plan origin: if the header references `nestjs-plan` or the plan path matches a backend slice, the final wave MUST run `nimbou-skills:nestjs-test` scoped strictly to the files the plan touched. Add the dispatch to TodoWrite if the plan author forgot it. Never let the final wave widen into an unfiltered `pnpm test` run.
6. Detect `## Pos-execucao` (typical for `nuxt-plan` output). Capture those items now to seed the follow-ups artifact in Step 3.
7. Create TodoWrite (one entry per wave, plus one entry per task inside each wave, plus the post-wave commit, plus a single "collect background review results" entry, plus Step 3) and proceed only when the plan is executable.

## Step 2: Execute

For each wave, in declared order:

### 2.1 Check the write sets

Before dispatching anything, list the files each task in the wave declares it will touch.

- **Disjoint write sets (the expected case):** fan out. Proceed to 2.2.
- **Two or more tasks writing the same file:** those tasks are not parallel-safe regardless of what the plan says. Group them into one implementer subagent that owns that file end to end, and fan the rest out normally. Record the collision as a `concern` for Step 3 — the plan should not have declared them parallel.
- **Single-task wave:** skip the dispatch. The controller implements it directly; a subagent buys nothing here.

### 2.2 Fan the wave's tasks out to implementer subagents

Dispatch **one implementer subagent per task**, all in a **single message with multiple parallel `Agent` calls**.

Build each prompt from `./implementer-prompt.md`. Each implementer gets:

- the task's full text, verbatim from the plan
- the exact files it owns, and an explicit statement that it must not touch any other file
- the task's declared verification command, **verbatim** — implementers run it themselves
- the contracts produced by earlier waves that this task consumes (types, signatures, routes), pasted in
- the required report shape: files touched, behavior changed, verification output, concerns

The controller does **not** write implementation code during a fan-out wave. It reads reports, resolves conflicts, and commits.

## Role Routing

`nestjs-plan` declares a `**Role:**` line per task; `nuxt-plan` declares a `Role` column per file row. That slug **is** the implementer's `subagent_type` — the planners write it specifically so this skill can route without guessing.

| Role slug | Owns |
|---|---|
| `nimbou-skills:prisma-schema-author` | `schema.prisma` and migrations. No application code. |
| `nimbou-skills:prisma-repository-author` | Concrete repositories under `infra/persistence/` against an existing application port. |
| `nimbou-skills:nestjs-usecase-author` | One application use-case (one business verb) and the ports it consumes. No HTTP wiring, no Prisma. |
| `nimbou-skills:nestjs-controller-author` | HTTP transport: controller, HTTP DTO, guards, validation pipes, module composition. No business logic. |
| `nimbou-skills:vue-component-author` | SFCs under `components/` |
| `nimbou-skills:nuxt-composable-author` | `composables/` and the `utils/` they consume |
| `nimbou-skills:nuxt-page-author` | `pages/`, `layouts/`, and route wiring |

Rules:

- **Fallback:** a task with no `Role` gets `general-purpose`, you say so in the wave report, and you record it as a `concern` for Step 3 — same as a write-set collision. Both are planning defects, and follow-ups is where they get triaged. Fix the plan rather than leaning on the fallback.
- **Never infer a role from the file path.** If the plan did not declare one, the fallback applies — silently picking `prisma-repository-author` because the path contains `infra/` hides a planning bug.
- Final-wave `nestjs-test` tasks and `## Pos-execucao` items carry no `Role`. They route through the test auditors and follow-ups, not through implementers.
- One role per task. A task that would fit two roles was mis-planned; record it as a `concern` and dispatch it under the role that owns the larger share.

### 2.3 Collect and verify

Wait for every implementer in the wave to return, then:

1. Read each report.
2. Confirm no implementer wrote outside its declared file set (`git status` against the union of declared files). Anything extra is a finding — decide whether to keep it or revert it, and record it as a `concern`.
3. Re-run the wave's verifications yourself if any implementer's verification output is missing, ambiguous, or claimed rather than shown. Run them **exactly as the plan declares** — they are already scoped to the files the wave changes. Never substitute an unfiltered test command (no bare `pnpm test`, `npm test`, `pytest`).
4. Mark each task complete in TodoWrite.

If an implementer reports failure, or a verification cannot be satisfied, stop downstream waves. Report the exact file/task/wave that blocked the flow. **Do not commit a partially completed wave.** Reviewer ❌ findings never trigger this stop — they go to follow-ups.

### 2.4 Commit the wave

**Commit once per wave**, immediately after every task in the wave is implemented and its verifications pass:

- One commit per wave. Stage explicitly the files touched by the wave; never use `git add -A`.
- Mirror the repo's recent commit-message style (see `git log` on the current branch). Reference the wave (e.g., `Onda N — <título>`) and list the tasks included.
- Do not wait for reviews. Reviews are advisory and run in background.

### 2.5 Dispatch the wave's reviewers, then move on

Right after the commit lands, dispatch both reviewers in a single message with two parallel `Agent` calls (`run_in_background: true`):

- **Spec compliance reviewer** — `Agent` with `subagent_type: general-purpose`, prompt built from `./spec-reviewer-prompt.md` over the wave's commit diff. Its job is to detect Missing/Extra/Misunderstanding findings and `⚠️ Deferred` items.
- **Code reviewer** — `Agent` with `subagent_type: nimbou-skills:code-reviewer`, scoped to the same commit range, briefed via `nimbou-skills:request-review` placeholders.

Record each background agent's id/name in TodoWrite under the "collect background review results" entry so Step 3 can pick them up.

Do **not** wait for either review to return. Open the next wave as soon as the current one is committed and its two reviewers are dispatched.

### 2.6 Final wave

If the plan came from `nestjs-plan`, the final wave is `nimbou-skills:nestjs-test`. Run it after the last implementation wave's commit, not before. The dispatch scope must cover **only what this plan changed** — controllers, use-cases, repositories, Prisma adapters, and migrations introduced or modified across waves 1 through N — and nothing else. When briefing `nestjs-test`, list the explicit suite/file paths derived from the plan's diff and require that the test runner be invoked with those paths (e.g., `pnpm test -- --runInBand <suite-path>`); reject any briefing that resolves to an unfiltered suite run. The `nestjs-test` wave itself follows the same pattern: commit when green, then dispatch its two background reviewers.

Do not flatten the wave topology unless the user approves it. Do not invent serial dependencies the plan did not declare. Do not widen a wave to absorb the next one because its tasks look small.

## Step 3: Collect Reviews and Generate Follow-ups Artifact

After **all** waves have finished and committed (including the final `nestjs-test` wave when applicable):

1. Wait for every background review subagent dispatched in Step 2.5 to finish. Read each one's result. **Do not skip any** — even if some waves are old, their reviewers' findings still belong in follow-ups.
2. Collect deferred items from these sources:
   - **Every finding** returned by the per-wave spec reviewer subagents — `❌ Issues found` and `⚠️ Deferred (non-blocking)` alike. Since reviews are non-blocking here, both buckets land as follow-ups.
   - **Every finding** returned by the per-wave code reviewer subagents — Critical, Important, and Minor. Since reviews are non-blocking here, all severities land as follow-ups, tagged by severity so the user can triage.
   - Concerns raised during execution — by an implementer subagent in its report, or by the controller itself (architectural doubt, file growing too large, write-set collision, refactor suggestion, anything `DONE_WITH_CONCERNS`-equivalent).
   - Items declared in the plan's `## Pos-execucao` section (when present).
3. If the collected list is **empty**: do not create any file. Announce "Plano executado sem follow-ups pendentes." and stop here.
4. Otherwise, write `<plan>.followups.md` next to the plan file (same directory, same basename, `.followups.md` suffix) using `./followups-template.md`. Each entry must carry:
   - **Tipo** — one of `spec-issue` | `spec-deferred` | `review-critical` | `review-important` | `review-minor` | `concern` | `pos-execucao`.
   - **Origem** — which wave/reviewer produced the item.
   - **Descrição** — short one-liner with `file:line` when applicable.
   - **Próximo passo** — the reviewer's suggested action, or `a definir` if none was given.

The follow-ups artifact is **not** part of any wave commit. Commit it separately as a docs commit. Then proceed to Step 4 to execute the collected follow-ups.

## Step 4: Execute Follow-ups

After `<plan>.followups.md` is committed (or confirmed empty), work through **all** collected items before declaring the plan complete:

1. Triage the follow-ups list by severity: `review-critical` and `spec-issue` first, then `review-important`, then `review-minor`, `concern`, and `pos-execucao` last.
2. Split the automatable items into **groups by file**. Two items touching the same file belong to the same group; items touching disjoint files are independent.
3. Dispatch **one subagent per group, in parallel**, in a single message. Each gets the findings for its files, the affected file paths, and the scoped verification command for those files. Severity ordering still governs what lands inside a group's prompt first, but groups themselves do not wait on each other — they are disjoint by construction.
4. For each returned group: mark its entries resolved in `<plan>.followups.md` with a one-line resolution note and the commit that fixed it.
5. **If an item requires a manual action** (human decision, external system change, environment config, infra adjustment, or anything the agent cannot execute): do **not** write it to the file. Surface it in the output under a clearly labelled "Ações manuais necessárias" section, describing what needs to be done and why the agent cannot do it.
6. Commit all follow-up fixes together in a single commit (or one commit per logical group when fixes are unrelated). Stage explicitly — never `git add -A`.
7. Dispatch a final background code reviewer subagent over the follow-up commit(s) to confirm the fixes landed correctly. Append any new findings back to `<plan>.followups.md` as `review-*` entries marked `(follow-up round)`.
8. When all automatable items are resolved, announce: "Plano executado. Todos os follow-ups automatizáveis resolvidos." If manual items were surfaced, list them once more in the final announcement so the user has them in one place.

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

- review the plan critically first
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

Local templates:

- `./implementer-prompt.md` — per-task implementer subagent prompt, dispatched in parallel inside a wave
- `./spec-reviewer-prompt.md` — per-wave spec compliance reviewer prompt (dispatched as a background subagent)
- `./followups-template.md` — skeleton for `<plan>.followups.md`

Packaged orchestration:

- `/nimbou-skills:execute-plan` — Claude Code workflow that runs Steps 2-4 as a script. See Fast Path above.

## Output Discipline

When execution completes or stops, report:

- which waves were executed and committed, and how many implementer subagents ran in each
- what each per-wave spec reviewer subagent returned (✅ / ❌ / ⚠️ Deferred), per wave
- what each per-wave code reviewer subagent returned (Critical/Important/Minor counts), per wave
- what failed or remains blocked, and whether the failure belongs to one task, one file, or one wave
- whether `<plan>.followups.md` was generated, where it lives, and whether it carries `review-critical` or `spec-issue` entries the user should look at
