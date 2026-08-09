# Prose Execution Path (Steps 2-5)

The executable body of `nimbou-skills:executing-plans`, extracted so the skill itself
stays a router.

**Who follows this file:** Codex, always. Claude Code only when
`/nimbou-skills:run-waves` is unavailable — dynamic workflows disabled, an older
Claude Code, or a plan small enough that launching a workflow is not worth it.

**This file is normative.** `plugins/nimbou-skills/workflows/run-waves.js` mirrors it.
When the two disagree, this file wins and the workflow is the bug.

Step 1 lives in `SKILL.md` and runs before anything here. Do not start at Step 2.

---

## Step 2: Execute

### 2.0 Anchor the run

Before the first wave, run `git rev-parse --show-toplevel`, `git rev-parse --abbrev-ref HEAD`, and `git worktree list`. That absolute path is `WORKTREE_ROOT`, and it goes verbatim into every implementer prompt, the commit step, and both reviewers. State it, the branch, and the sibling checkouts once in the run's opening report so the user can see which checkout is being written to.

This is not ceremony. A subagent does not reliably inherit your working directory, and a plan that writes its paths as absolute is naming a checkout that may not be the one you are on. When part of a wave lands in the main checkout while you commit from a worktree, the commit succeeds and is silently missing those files — and the fracture surfaces two waves later as a contract that "diverged", pointing at the wrong problem.

Two checks before dispatching anything:

- **Refuse a long-lived branch.** `main`, `master`, `dev`, `develop`, `staging`, `production` — a run sitting on one of these is almost always the main checkout rather than the worktree that was set up for this plan. Stop and ask, rather than implementing there. Only an explicit "yes, implement on this branch" from the user overrides it.
- **Keep the sibling list.** Every other checkout `git worktree list` named is where a stray write can land. You need those paths in 2.3, and hunting them down after the fact is what turns a five-minute recovery into an afternoon.

For each wave, in declared order:

### 2.1 Check the write sets

Before dispatching anything, list the files each task in the wave declares it will touch.

- **Disjoint write sets (the expected case):** fan out. Proceed to 2.2.
- **Two or more tasks writing the same file:** those tasks are not parallel-safe regardless of what the plan says. Group them into one implementer subagent that owns that file end to end, and fan the rest out normally. Record the collision as a `concern` for Step 3 — the plan should not have declared them parallel.
  - **What happens to the Role.** The merged group keeps its `Role` when every task in it declared the same one. When they declare **different** Roles there is no correct winner, so the group falls back to `general-purpose` and you record the loss as a second `concern`, naming the Roles that were dropped. A collision therefore costs the specialized routing on top of the parallelism — one more reason it is a planning bug to fix rather than absorb.
- **Single-task wave:** skip the dispatch. The controller implements it directly; a subagent buys nothing here.

### 2.2 Fan the wave's tasks out to implementer subagents

Dispatch **one implementer subagent per task**, all in a **single message with multiple parallel `Agent` calls**.

Build each prompt from `./implementer-prompt.md`. Plans from `nestjs-plan` and `nuxt-plan`
declare an Execution Contract per task — `Role`, `Onda`, `Files`, `Consome`, `RED`, `Verificação` —
directly under the task heading. Read those fields; do not re-derive them from the prose.
Each implementer gets:

- `WORKTREE_ROOT` from 2.0, as an absolute path, with the instruction to verify it with `git rev-parse --show-toplevel` before its first write and to re-anchor any absolute path the plan wrote against a different checkout
- the task's full body — either pasted verbatim, or handed as a `Read` of the plan file at the task's exact line range. The two are equivalent, and the range is cheaper: re-emitting a plan's prose just so it can be pasted back costs the whole document in output tokens, which are the expensive ones. When you pass a range, tell the implementer to `Grep` the plan for the task heading if the first line it reads is not that heading, and to report a blocker rather than implement a guess. `run-waves` takes the range path; a controller that already has the plan in context can just paste
- `Files` as the exact set it owns, and an explicit statement that it must not touch any other file
- `RED` **verbatim** — the same command run *before* implementation, expecting FAIL, plus the failure class the plan declared. The implementer writes the test, runs this, and confirms the failure is the declared one before writing a line of implementation
- `Verificação` **verbatim** — implementers run it themselves. It is the command expecting PASS, run after
- `Consome` pasted in as actual declarations, not referenced by name
- the required report shape: files touched, behavior changed, **red run output**, verification output, concerns

**The red run is reported, not assumed.** Instruct every implementer to return the actual output of its `RED` command and one line on why that output proves the test was real. A failure caused by an unresolvable provider, a missing module, or a parse error exercised no behavior — that is a red run to fix before implementing, not one to report. A task that declared `RED: n/a` reports that string with the plan's reason.

This is the whole reason the field exists. The Iron Law in `nimbou-skills:test-driven-development` is unenforceable while the red run lives only in prose: an implementer that writes test and implementation together still comes back green, and nothing downstream can tell the difference. A reported red run is the only artifact that distinguishes them.

**A task in wave 2+ whose `Consome` is empty is a planning bug, not an empty dependency.**
The wave exists because it consumes something earlier. Record it as a `concern`, and reconstruct
the contract from the earlier wave's committed diff before dispatching — an implementer told it
depends on nothing will redeclare the type it should have imported.

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
- **A write-set collision can cost the Role.** Merged tasks keep it only when they agree on it; conflicting Roles fall back to `general-purpose` with a `concern`. See Step 2.1.
- **Never infer a role from the file path.** If the plan did not declare one, the fallback applies — silently picking `prisma-repository-author` because the path contains `infra/` hides a planning bug.
- Final-wave `nestjs-test` tasks and `## Pos-execucao` items carry no `Role`. They route through the test auditors and follow-ups, not through implementers.
- One role per task. A task that would fit two roles was mis-planned; record it as a `concern` and dispatch it under the role that owns the larger share.

### 2.3 Collect and verify

Wait for every implementer in the wave to return, then:

1. Read each report.
2. Reconcile `git status --porcelain`, **run in `WORKTREE_ROOT`**, against two lists: what the implementers reported touching, and what the plan declared for this wave. Three outcomes, and they are not the same finding:
   - **Reported as touched, but no change here** — the work landed in another checkout. **Stop the wave and commit nothing.** This is the one that hides: the files exist, the implementer's report is honest, the verification it ran even passed, and only this checkout is empty. Then **find it**: run `git -C <checkout> status --porcelain` in each sibling from 2.0 and name the one holding those paths. Report both — what is missing and where it went — and recover the paths into `WORKTREE_ROOT` before rerunning. A commit here produces a branch whose code references files it does not contain.
     - **After any rescue, start a fresh run.** Do not resume from a previous run's cache: it replays implementer reports describing edits that were since moved or discarded, so the run reports "done" for files nobody wrote.
   - **Declared by the plan, touched by nobody** — a `concern`, not a stop. The task may have been merged, or the plan over-declared.
   - **Changed but declared by nobody** — an implementer wrote outside its boundary. Decide whether to keep or revert it, and record a `concern`. Do not revert silently.
3. Re-run **only** the verifications whose implementer came back with a claim rather than a transcript. An implementer that pasted actual runner output already ran that suite; re-running it doubles the wave's test time on the sequential critical path, and the commit is the one step every later wave waits on. `passou` is a claim; a runner transcript is evidence. When you do re-run, run the command **exactly as the plan declares** — it is already scoped to the files the wave changes. Never substitute an unfiltered test command (no bare `pnpm test`, `npm test`, `pytest`).
4. Mark each task complete in TodoWrite.

If an implementer reports failure, or a verification cannot be satisfied, stop downstream waves. Report the exact file/task/wave that blocked the flow. **Do not commit a partially completed wave.** Reviewer ❌ findings never trigger this stop — they go to follow-ups.

### 2.4 Commit the wave

**Commit once per wave**, immediately after every task in the wave is implemented and its verifications pass:

- One commit per wave, from `WORKTREE_ROOT`. Stage explicitly the files touched by the wave; never use `git add -A`.
- **A wave with a missing reported file is not committable.** 2.3 already stopped it; do not stage "the part that is there" to keep momentum.
- Mirror the repo's recent commit-message style (see `git log` on the current branch). Reference the wave (e.g., `Onda N — <título>`) and list the tasks included.
- Do not review here. Spec review is advisory and happens once, at the end of the plan.

### 2.5 Record the wave for review, then move on

Right after the commit lands, record in TodoWrite — under the "collect spec review" entry — the wave's label, its commit SHA, the `specLines` ranges of its tasks, and what its implementers claimed. That is the payload Step 3 will hand to the reviewer.

Do **not** dispatch a reviewer per wave. **One** spec compliance reviewer runs at the end, over every committed wave at once — `Agent` with `subagent_type: general-purpose` (declared explicitly, never left to the default), prompt built from `./spec-reviewer-prompt.md`. Its job is to detect Missing/Extra/Misunderstanding findings and `⚠️ Deferred` items.

Why one pass and not N: the reviewer is the run's most expensive agent, and N reviewers each re-read the plan and re-establish context for a diff that only makes full sense alongside the others. A single pass also sees cross-wave drift — a contract set in wave 1 and quietly reshaped in wave 3 — which no per-wave reviewer can see. The cost is that findings arrive at the end rather than alongside the next wave; that is acceptable because reviews were never blocking anyway.

Alongside it, at the same point in Step 3, runs **one** `nimbou-skills:guidelines-gap-analyzer` pass over the same commits. That is the second and last lens: architecture boundaries, conventions, missed reuse. It is deliberately blind to the plan — the spec reviewer holds that.

**Full `/code-review` is not part of this skill, and is no longer its default follow-up.** Three things now cover its ground: every task was driven by a failing test whose red run is on the record, the spec reviewer holds the plan, and the gap analyzer holds the boundaries. Run `/code-review` over the branch when you want a further pass — before a risky merge, on unfamiliar territory — not mechanically on every plan.

What none of the three replaces: a defect that is correct against the spec, inside the boundaries, and covered by a passing test — a subtle N+1, an authorization path nobody thought to specify, a DTO exposing a field it should not. TDD does not find the test you never thought to write. That is what `/code-review` is still for, and it is a judgment call about the change, not a step.

Open the next wave as soon as the current one is committed and recorded.

### 2.6 Final wave

If the plan came from `nestjs-plan`, the final wave is `nimbou-skills:nestjs-test`. Run it after the last implementation wave's commit, not before. The dispatch scope must cover **only what this plan changed** — controllers, use-cases, repositories, Prisma adapters, and migrations introduced or modified across waves 1 through N — and nothing else. When briefing `nestjs-test`, list the explicit suite/file paths derived from the plan's diff and require that the test runner be invoked with those paths (e.g., `pnpm test -- --runInBand <suite-path>`); reject any briefing that resolves to an unfiltered suite run.

Brief it for **final-wave mode**: run and stabilize, do not re-write coverage. Every task in the plan was already driven by its own failing test, so the per-slice assertions exist — asserting them a second time is rework that then needs maintaining twice. New tests belong here only at the **seams between tasks**, which is the one thing no individual task could have proved: that controller, use-case, and repository actually compose. Behavior found with no test at all is a finding about the plan — its task's `RED` was fake or skipped — so require that it be written *and* reported as a `concern`. The `nestjs-test` wave itself follows the same pattern: commit when green, then record it for the end-of-plan spec review like any other wave.

Do not flatten the wave topology unless the user approves it. Do not invent serial dependencies the plan did not declare. Do not widen a wave to absorb the next one because its tasks look small.

## Step 3: Collect Reviews and Generate Follow-ups Artifact

After **all** waves have finished and committed (including the final `nestjs-test` wave when applicable):

1. Dispatch both reviewers concurrently over every wave recorded in Step 2.5, in order:
   - **Spec compliance** — give it each wave's label, commit SHA, task spec ranges, and implementer claims, including each task's reported red run, and instruct it to read the diffs rather than trust the claims. Auditing the red-run claims against the diff is part of its job: implementation committed with no test, or a red run whose failure could not have exercised the behavior, is a `spec-issue`. **Do not drop a wave** — an early wave's diff is as reviewable as the last one, and cross-wave drift is only visible when all of them are in scope.
   - **Boundary lens** — `Agent` with `subagent_type: nimbou-skills:guidelines-gap-analyzer` over the same commits. Give it the SHAs and nothing from the plan. Its findings are `guideline-issue` / `guideline-deferred`.
2. Collect deferred items from these sources:
   - **Every finding** returned by either reviewer — `❌ Issues found` and `⚠️ Deferred (non-blocking)` alike. Since review is non-blocking here, both buckets land as follow-ups.
   - Concerns raised during execution — by an implementer subagent in its report, or by the controller itself (architectural doubt, file growing too large, write-set collision, refactor suggestion, anything `DONE_WITH_CONCERNS`-equivalent).
   - Items declared in the plan's `## Pos-execucao` section (when present).
3. If the collected list is **empty**: do not create any file. Announce "Plano executado sem follow-ups pendentes." and stop here.
4. Otherwise, write `<plan>.followups.md` next to the plan file (same directory, same basename, `.followups.md` suffix) using `./followups-template.md`. Each entry must carry:
   - **Tipo** — one of `spec-issue` | `spec-deferred` | `guideline-issue` | `guideline-deferred` | `concern` | `pos-execucao`. The `review-*` types exist in the template for findings you append yourself after running `/code-review`; this skill never writes them.
   - **Origem** — which wave/reviewer produced the item.
   - **Descrição** — short one-liner with `file:line` when applicable.
   - **Próximo passo** — the reviewer's suggested action, or `a definir` if none was given.

The follow-ups artifact is **not** part of any wave commit. Commit it separately as a docs commit. Then proceed to Step 4 to execute the collected follow-ups.

## Step 4: Execute Follow-ups

After `<plan>.followups.md` is committed (or confirmed empty), work through **all** collected items before declaring the plan complete:

1. Triage the follow-ups list by severity: `spec-issue` first, then `guideline-issue`, then `concern`, then the two deferred buckets, then `pos-execucao`. When you have already appended `/code-review` findings, `review-critical` sorts above `spec-issue` and `review-important` / `review-minor` below `guideline-issue`.
2. Split the automatable items into **groups by file**. Two items touching the same file belong to the same group; items touching disjoint files are independent.
3. Dispatch **one subagent per group, in parallel**, in a single message. Each gets the findings for its files, the affected file paths, and the scoped verification command for those files. Severity ordering still governs what lands inside a group's prompt first, but groups themselves do not wait on each other — they are disjoint by construction.
4. For each returned group: mark its entries resolved in `<plan>.followups.md` with a one-line resolution note and the commit that fixed it.
5. **If an item requires a manual action** (human decision, external system change, environment config, infra adjustment, or anything the agent cannot execute): do **not** write it to the file. Surface it in the output under a clearly labelled "Ações manuais necessárias" section, describing what needs to be done and why the agent cannot do it.
6. Commit all follow-up fixes together in a single commit (or one commit per logical group when fixes are unrelated). Stage explicitly — never `git add -A`.
7. Proceed to Step 5. Only announce completion after it.

## Step 5: Browser Smoke

**Applies when the committed diff touched frontend surface** — any `*.vue`, or anything under `pages/`, `components/`, `layouts/`, `composables/`, `middleware/`, `assets/`, plus `nuxt.config.*` and stylesheets. The trigger is the diff, not the plan's origin: a backend plan that touched one SFC still put something on screen, and a frontend plan that only moved a util did not. When nothing matches, say so in one line and skip to the final announcement.

This runs **after** the follow-up commits, over the state the branch actually ends in. It is the only lens in the whole run that looks at the application instead of at its source — red runs, spec compliance, and the boundary analyzer all pass on a change whose page renders blank.

1. Dispatch **one** subagent with `nimbou-skills:browser-smoke` in **`report` mode**, giving it `WORKTREE_ROOT`, the plan path, and the frontend files the run committed. The skill owns the mechanics: driver selection, bringing the app up, the health check, deriving flows from the plan's promises, and evidence. `report` mode matters — the fix cycle and every commit stay here.
2. **`SKIPPED` is not a failure.** No browser driver, or an app that never came up, says nothing about the code. Record the reason as a `concern` and stop the step. Never open a fix cycle on it, and never report the change as verified.
3. **`FAIL` reopens the fix cycle, at most once.** Group the findings by file, dispatch one fixer per group in parallel, commit their work as its own commit, then re-run the smoke over **only the failing flows**. Two rounds total: the first fix often reveals the defect behind it, and a third round on a run this long costs more than it finds.
4. Whatever still fails after those rounds goes into `<plan>.followups.md` as `browser-issue`, with the flow sentence and the screenshot path, committed on its own. Same for concerns the smoke raised.
5. Then announce: "Plano executado. Todos os follow-ups automatizáveis resolvidos." State which lenses ran — TDD red runs per task, spec compliance, boundary analysis, and the browser smoke with its verdict — so the user can judge whether a `/code-review` pass over the branch is worth it before merging. If manual items were surfaced, list them once more so the user has them in one place.
