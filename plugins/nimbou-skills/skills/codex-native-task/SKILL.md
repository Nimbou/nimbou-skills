---
name: codex-native-task
description: Use when the user asks to create or start a native task in Codex Desktop or from Codex CLI, including tasks with Full Access, a specific model, or a Git worktree.
---

# Create a Native Codex Task

Create and start a persistent Codex task that appears in the user's Codex Desktop. When working in Desktop, use the app's own task creation surface so Desktop owns the running turn.

## Close the handoff

Resolve the task's purpose, target checkout, requested model and reasoning effort from the conversation and applicable model policy. Carry forward scope, validation preferences, unresolved decisions and subagent restrictions. Ask only for information that cannot be inferred and materially affects creation.

Default to `gpt-6.2-sol` with `low` reasoning unless the user or an explicitly authorized handoff specifies another model/effort.

Always create with **Full Access** (`sandbox: "danger-full-access"` and `approvalPolicy: "never"`). Establish the effective permissions on the creation target before submitting the first prompt and verify what the new task received. If Full Access is unavailable or cannot be established, report the limitation before submitting. If verification after submission shows a mismatch, preserve the native ID and receipt, stop that turn using the owning client if possible, and report what happened. Keep global configuration unchanged.

For a plan-execution task, include the saved plan path and source checkout. A draft plan may be handed off for preparation, but the new task must resolve its missing decisions before implementing it. Do not implement the work in the source conversation instead of creating the requested task.

Task creation must already be authorized by the user's request or an applicable authorized handoff. Do not ask for permission again when it has already been given. Creating the task does not grant permission for additional subagents, production changes, deployment or merge.

## Identify the active client and route

Use the host context when it identifies Codex Desktop or Codex CLI. Otherwise run `python <skill-dir>/scripts/native_task.py detect`. It reads only the launcher hint and reports `desktop`, `cli`, or `unknown`. The presence of a binary or daemon does not establish the active client.

| Active client | Creation route |
|---|---|
| Desktop | Use the app's native task tool or its native composer if the session exposes supported UI automation. Creation and the first turn must go through Desktop. A shared history directory does not make a separately running App Server part of Desktop. |
| CLI | Use an available native Desktop tool targeting the user's Desktop project. Otherwise use the bundled helper only against an already-running, verified local App Server whose tasks appear in that Desktop profile. Verify visibility separately from which process owns the running turn. |
| Unknown | Prefer a verified native route into the user's Desktop. Establish CLI origin before using the App Server helper for creation. Report an unresolved origin as unknown. |

**Never launch another App Server for this workflow.** Do not start or restart a daemon, run `codex app-server --listen`, open a temporary socket backed by a new process, or use `codex exec` to substitute for native creation. In Desktop, a missing tool parameter or unavailable UI is a Desktop blocker. In CLI, an unavailable or unverified existing server is a CLI blocker. Resolve the route before preparing a checkout or creating a task.

For Desktop, inspect the native tool's actual schema. Use it when the checkout can be targeted and Full Access can be selected or its inheritance for this creation request can be verified. Settings in `config.toml` or Full Access on a different chat alone do not establish how a new task will start. If the tool cannot establish Full Access, use the Desktop composer through supported UI controls when available. Select the checkout, model, reasoning effort and **Full Access** before submitting the prompt. If neither route is available, report the missing capability.

For the CLI helper, read [App Server connection diagnosis](references/local-api.md#connection-diagnosis) and run a read-only probe before preparing the checkout.

## Prepare the checkout

**Required sub-skill:** Use `nimbou-skills:using-git-worktrees` for checkout isolation, project setup and baseline checks. Resolve the base revision from the requested branch or plan, or from the source checkout's current HEAD. If the Desktop route provisions the worktree itself, pin its starting state to the verified branch and revision and include the checkout, revision, plan and baseline checks in the first prompt before implementation. Otherwise create the isolated checkout with `git worktree add` at the explicit base and target that exact checkout.

Reuse an existing worktree only when it is already dedicated to this same task, including retries. Use the source checkout only when explicitly requested. Verify the checkout path, base revision and required artifacts, including the plan when applicable. Copy only uncommitted files required by the authorized starting state. If checkout preparation is blocked, report the blocker before creating the task.

## Create and start

1. Use one durable receipt for the operation. On the Desktop route, record the intended target and then the ID returned by the app. For the CLI helper, follow [the local API guide](references/local-api.md) and run `scripts/native_task.py create`. The helper persists intent and IDs and verifies the effective settings between `thread/start` and `turn/start`. `--authorized` records authorization already given.
2. Verify the native task ID, effective model and effort, Full Access policies, worktree checkout and observed turn state. Confirm the task in Desktop inventory when available. On the Desktop route, check that the Desktop can open the task and observe its turn. Report a task hosted elsewhere accurately if the CLI route created it in a shared profile.

If a creation request has an uncertain outcome, reconcile the owning client's state using the same receipt before retrying. Retry only after confirming the failed attempt created no task. Keep shared sessions, authentication and global configuration intact.

## Report

Return the active client, route, native task ID and name, verified model and effort, Full Access policies, worktree and current state. Distinguish a task appearing in Desktop from Desktop owning the active turn. If a required capability was unavailable, identify the specific blocker.
