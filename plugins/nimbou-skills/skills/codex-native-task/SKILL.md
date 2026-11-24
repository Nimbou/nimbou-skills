---
name: codex-native-task
description: Use when the user asks to create or start a persistent native task in Codex Desktop or Codex CLI, including tasks with Full Access, a model and reasoning effort, or a Git worktree.
---

# Create a Native Codex Task

Create and start a persistent Codex task. Prefer Desktop-owned execution when the request comes from Desktop. A saved CLI task can be opened in Desktop and continued there.

## Close the handoff

Resolve the purpose, target checkout, model, and reasoning effort from the conversation and applicable model policy. Carry forward the user's scope, validation preferences, unresolved decisions, and subagent restrictions. Ask only about decisions that materially affect creation.

Default to `gpt-6.2-sol` with `low` reasoning unless the user or an authorized handoff specifies another model and effort.

Always create with **Full Access** (`sandbox: "danger-full-access"` and `approvalPolicy: "never"`). Verify the effective permissions on the target before submitting the initial prompt. If a mismatch is discovered after submission, preserve the ID and receipt, stop the turn through the owning client if possible, and report the mismatch. Keep global configuration unchanged.

For plan execution, include the saved plan path and source checkout. A task receiving a draft resolves its open decisions before implementation. Task creation requires authorization and does not authorize production changes, deployment, merging, or additional agents. Start the separate task instead of implementing in the source conversation.

## Identify the active client and select a route

Use the host context when it identifies Codex Desktop or Codex CLI. Otherwise run `python <skill-dir>/scripts/native_task.py detect`. It reports the launcher hint as `desktop`, `cli`, or `unknown`. The presence of a binary or daemon does not establish the active client.

| Request or active client | Creation route |
|---|---|
| Desktop | Use the native task tool when its schema can select Full Access or establish it for this creation request. Otherwise use the Desktop composer through supported UI controls if available. Use the [interactive CLI fallback](references/interactive-cli.md) when the Desktop routes are unavailable. |
| CLI requested or active | Use the [interactive CLI](references/interactive-cli.md) for a terminal-owned task. From a CLI-originated conversation, the [local App Server helper](references/local-api.md) is available when creating through a verified, already-running server visible to the Desktop profile. Probe that server before using the helper. |
| Unknown | Prefer an available native route with verifiable settings. The interactive CLI works as a new launch on the intended host. Establish CLI origin before using the App Server helper. |

If the user explicitly requires Desktop to own the first turn, use only Desktop creation. If the user asks for a persistent task or wants to continue it in Desktop, the CLI fallback is allowed. When a Desktop submission may already have created a task, reconcile the Desktop inventory and receipt before using the CLI fallback.

For the Desktop composer, select checkout, model, effort, and Full Access before submitting. Full Access on a different chat or settings in `config.toml` alone are insufficient evidence. For the terminal, use a supported CLI launch on the intended host and verify the selected settings in that session before submitting. If neither route can establish Full Access or meet the required ownership, report the specific blocker before submitting a prompt.

Use the standard interactive CLI for the fallback. Do not launch or restart a standalone App Server, open a temporary control socket, or use `codex exec` in place of an interactive or Desktop-owned task.

## Prepare the checkout

**Required sub-skill:** Use `nimbou-skills:using-git-worktrees` for isolation, setup, and baseline checks. Resolve the base revision from the requested branch or plan, or from the source checkout's current HEAD. If Desktop provisions the worktree, pin its starting branch and revision. Include the pinned checkout, base revision, plan path, and baseline checks in the initial prompt. Otherwise create the isolated worktree at the explicit base revision and target that exact checkout.

Reuse a worktree only when it is already dedicated to this task, including retries. Use the source checkout only at the user's explicit request. Verify the checkout path and revision. Copy only the uncommitted plan and supporting files required by the authorized starting state. If preparation is blocked, report the blocker before launching the new task.

## Create and start

1. Record the intended route, checkout, base revision, model, effort, and Full Access in one durable receipt. Record the returned native ID as soon as it is available. For the CLI App Server helper, follow the local API guide and pass `--authorized` to record consent already given.
2. Verify the native task ID, effective model and effort, Full Access policies, worktree, and observed turn state. Check Desktop inventory when visibility there is requested or can be verified. For a CLI launch, use the documented Desktop handoff when appropriate and report where the turn started.

On an uncertain outcome, reconcile using the same receipt and owning client before retrying. Retry creation only after verifying the earlier attempt created no task.

## Report

Give the route, task ID and name, verified model and effort, Full Access, checkout, and turn state. State separately which client owns execution and whether the saved task is visible in Desktop.
