---
name: codex-native-task
description: Use when the user asks to create or start a persistent Codex task, including requests from Codex Desktop and tasks with Full Access, a model, reasoning effort, or a Git worktree. The interactive CLI is the default creation route.
---

# Create a Native Codex Task

Create and start a persistent Codex task. Default to the interactive CLI, including from Codex Desktop. A saved CLI task can be opened in Desktop and continued there.

## Close the handoff

Resolve the purpose, target checkout, model, and reasoning effort from the conversation and applicable model policy. Carry forward the user's scope, validation preferences, unresolved decisions, and subagent restrictions. Ask only about decisions that materially affect creation.

Default to `gpt-6.2-sol` with `low` reasoning unless the user or an authorized handoff specifies another model and effort.

Always create with **Full Access** (`sandbox: "danger-full-access"` and `approvalPolicy: "never"`). Verify the effective permissions on the target before submitting the initial prompt. If a mismatch is discovered after submission, preserve the ID and receipt, stop the turn through the owning client if possible, and report the mismatch. Keep global configuration unchanged.

For plan execution, include the saved plan path and source checkout. A task receiving a draft resolves its open decisions before implementation. Task creation requires authorization and does not authorize production changes, deployment, merging, or additional agents. Start the separate task instead of implementing in the source conversation.

## Select a creation route

| Request | Creation route |
|---|---|
| Persistent task, CLI execution, or a saved task that can later be opened in Desktop | Use the [interactive CLI](references/interactive-cli.md) on the intended host. The terminal owns the first turn. |
| Desktop must own the first turn | Use the Desktop task tool when it can apply and verify Full Access for this request. Use the Desktop composer through supported UI controls when the user requests that interaction. |
| Local App Server requested from a CLI-originated conversation | Use the [local App Server helper](references/local-api.md) with a verified, already-running server visible to the Desktop profile. Probe that server first. |

If the user explicitly requires Desktop to own the first turn, use only Desktop creation. When a previous submission may already have created a task, reconcile the owning client's inventory and the receipt before starting another session.

Verify checkout, model, effort, and Full Access in the selected composer or CLI session before submitting. If the selected route cannot establish Full Access or meet the required ownership, report the specific blocker before submitting a prompt. When the local helper requires CLI origin and the host context is inconclusive, use `python <skill-dir>/scripts/native_task.py detect` to check the launcher hint.

Use the standard interactive CLI for terminal-owned tasks. Do not launch or restart a standalone App Server, open a temporary control socket, or use `codex exec` in place of an interactive or Desktop-owned task.

## Prepare the checkout

**Required sub-skill:** Use `nimbou-skills:using-git-worktrees` for isolation, setup, and baseline checks. Resolve the base revision from the requested branch or plan, or from the source checkout's current HEAD. If Desktop provisions the worktree, pin its starting branch and revision. Include the pinned checkout, base revision, plan path, and baseline checks in the initial prompt. Otherwise create the isolated worktree at the explicit base revision and target that exact checkout.

Reuse a worktree only when it is already dedicated to this task, including retries. Use the source checkout only at the user's explicit request. Verify the checkout path and revision. Copy only the uncommitted plan and supporting files required by the authorized starting state. If preparation is blocked, report the blocker before launching the new task.

## Create and start

1. Record the intended route, checkout, base revision, model, effort, and Full Access in one durable receipt. Record the returned native ID as soon as it is available. For the CLI App Server helper, follow the local API guide and pass `--authorized` to record consent already given.
2. Verify the native task ID, effective model and effort, Full Access policies, worktree, and observed turn state. Check Desktop inventory when visibility there is requested or can be verified. For a CLI launch, use the documented Desktop handoff when appropriate and report where the turn started.

On an uncertain outcome, reconcile using the same receipt and owning client before retrying. Retry creation only after verifying the earlier attempt created no task.

## Report

Give the route, task ID and name, verified model and effort, Full Access, checkout, and turn state. State separately which client owns execution and whether the saved task is visible in Desktop.
