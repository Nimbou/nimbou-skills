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

## Prepare the checkout

**Required sub-skill:** Use `nimbou-skills:using-git-worktrees` to create the Git worktree before calling any task-creation tool. Follow it through directory selection, `git worktree add`, project setup and baseline checks. Resolve the base revision from the requested branch or plan, or from the source checkout's current HEAD, and pass it explicitly to `git worktree add`.

Reuse an existing worktree only when it is already dedicated to this same task, including retries. Use the source checkout only when explicitly requested. Verify the checkout path, base revision and required artifacts, including the plan when applicable. Copy only uncommitted files required by the authorized starting state. If checkout preparation is blocked, report the blocker before creating the task.

## Create and start

1. Discover available native tools and their actual schemas. Pass the already verified checkout path to task creation. Use a native creation tool only when it can accept that existing checkout and verify the required model, effort and Full Access settings before starting a turn. Worktree creation bundled with task creation does not satisfy the checkout prerequisite.
2. Otherwise use `scripts/native_task.py create` through the existing local App Server. This is a direct creation path, available even when the MCP connector is healthy. See [the local API guide](references/local-api.md) for setup and commands. The helper sets `cwd`, `model`, `config.model_reasoning_effort`, `sandbox` and `approvalPolicy` on `thread/start`, verifies the returned configuration, names the task and sends `turn/start` with the chosen model/effort and explicit Full Access policies.
3. Use one durable receipt for the operation. `--authorized` records authorization already given; it is not another approval gate. The helper persists intent and IDs before proceeding. Repeating the same request reads the existing task without submitting another prompt. Reconcile uncertain outcomes and stale locks against native state before retrying; never delete the receipt to force another creation.
4. Verify the native task ID, effective model/effort, Full Access policies, worktree checkout and observed turn state. Never silently substitute a model or claim an unverified effort or permission setting.

If a native tool fails with a transport error, stop repeating that mutation and use the local API path. Read-only `inspect` distinguishes a stale bridge from an unavailable daemon. Do not restart shared sessions, extract bearer tokens, weaken authentication or rewrite global configuration merely to create a task.

## Report

Return the native task ID/name, verified model/effort, Full Access policies, worktree and current state. Distinguish creation, a started turn, implementation progress and completion. If the connector failed but the native API worked, report successful task creation without claiming the old connector was repaired.
