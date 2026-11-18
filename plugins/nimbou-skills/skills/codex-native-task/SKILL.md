---
name: codex-native-task
description: Use when the user asks to create or start a native Codex task, including a separate task to execute a plan with a specified model, reasoning effort or Git worktree.
---

# Create a Native Codex Task

Create and start the requested persistent Codex task directly. This is the ordinary creation workflow: it does not require a connector failure first. The result is a native thread visible in Codex, not a collaboration subagent or a headless `codex exec` substitute.

## Close the handoff

Resolve the task's purpose, target checkout, requested model and reasoning effort from the conversation and applicable model policy. Carry forward scope, validation preferences, unresolved decisions and subagent restrictions. Ask only for information that cannot be inferred and materially affects creation.

Default to `gpt-6.2-sol` with `low` reasoning unless the user or an explicitly authorized handoff specifies another model/effort.

Always create with **Full Access**: `sandbox: "danger-full-access"` and `approvalPolicy: "never"`. Verify both effective values before starting the first turn. If the environment rejects or changes them, preserve the receipt and native ID, report the mismatch and do not start the turn or silently fall back to restricted access. Do not change global configuration.

For a plan-execution task, include the saved plan path and source checkout. A draft plan may be handed off for preparation, but the new task must resolve its missing decisions before implementing it. Do not implement the work in the source conversation instead of creating the requested task.

Task creation must already be authorized by the user's request or an applicable authorized handoff. Do not ask for permission again when it has already been given. Creating the task does not grant permission for additional subagents, production changes, deployment or merge.

## Identify the active client and route

Use the host context when it identifies the active client as Codex Desktop or Codex CLI. Otherwise run `python <skill-dir>/scripts/native_task.py detect` in the current task's shell. The command returns `desktop`, `cli`, or `unknown` and needs only Python 3.10+. It reads the launcher hint without connecting to the App Server. If the hint is absent or unrecognized, keep the origin `unknown`. A running daemon, the `codex` executable, and the `codex_tui` bridge describe available capabilities.

| Active client | Creation route |
|---|---|
| Desktop | Prefer the app’s native tool when its actual schema accepts the prepared checkout and verifies the requested configuration before the first turn. Otherwise use the existing local App Server when reachable. |
| CLI | Prefer the existing local App Server and the bundled helper. Use a native tool as an alternative only when it meets the same requirements and targets the current local host. |
| Unknown | Choose from the capabilities confirmed on the current local host. Prefer the App Server when the native tool’s host or configuration guarantees are unclear. Report the origin as unknown. |

Check the route before preparing a worktree. Every route must be able to create a persistent native task at the verified checkout, verify the effective model, effort and Full Access, and then start the first turn. Discover the native tool’s actual schema. A tool that starts immediately without verifying the required settings, or creates its own checkout, does not meet these requirements. Read [App Server setup and diagnosis](references/local-api.md#optional-connection-diagnosis) to confirm the direct route with a read-only probe. If every candidate is blocked, report the concrete tool or transport limitation before creating a checkout or task.

## Prepare the checkout

**Required sub-skill:** Use `nimbou-skills:using-git-worktrees` to create the Git worktree before calling any task-creation tool. Follow it through directory selection, `git worktree add`, project setup and baseline checks. Resolve the base revision from the requested branch or plan, or from the source checkout's current HEAD, and pass it explicitly to `git worktree add`.

Reuse an existing worktree only when it is already dedicated to this same task, including retries. Use the source checkout only when explicitly requested. Verify the checkout path, base revision and required artifacts, including the plan when applicable. Copy only uncommitted files required by the authorized starting state. If checkout preparation is blocked, report the blocker before creating the task.

## Create and start

1. Use the selected route with the verified checkout. For the App Server route, follow [the local API guide](references/local-api.md) and run `scripts/native_task.py create`. The helper calls `thread/start`, verifies the effective configuration, names the task, and submits `turn/start` with the chosen model, effort and Full Access settings.
2. Use one durable receipt for the operation. `--authorized` records authorization already given; it is not another approval gate. The helper persists intent and IDs before proceeding. Repeating the same request reads the existing task without submitting another prompt. Reconcile uncertain outcomes and stale locks against native state before retrying; never delete the receipt to force another creation.
3. Verify the native task ID, effective model/effort, Full Access policies, worktree checkout and observed turn state. Never silently substitute a model or claim an unverified effort or permission setting.

If a creation request has an uncertain outcome, reconcile the native state using the same receipt before retrying or switching routes. Switch only after confirming the failed attempt created no task. Keep shared sessions, authentication and global configuration intact.

## Report

Return the active client classification, selected route, native task ID/name, verified model/effort, Full Access policies, worktree and current state. Distinguish creation, a started turn, implementation progress and completion. If the connector failed but the native API worked, report successful task creation without claiming the old connector was repaired.
