---
name: codex-native-task
description: Use when the user asks to create or start a native Codex task, including a separate task to execute a plan with a specified model, reasoning effort or Git worktree.
---

# Create a Native Codex Task

Create and start the requested persistent Codex task directly. This is the ordinary creation workflow: it does not require a connector failure first. The result is a native thread visible in Codex, not a collaboration subagent or a headless `codex exec` substitute.

## Close the handoff

Resolve the task's purpose, target checkout, requested model and reasoning effort from the conversation and applicable model policy. Carry forward scope, validation preferences, unresolved decisions and subagent restrictions. Ask only for information that cannot be inferred and materially affects creation.

For a plan-execution task, include the saved plan path and source checkout. A draft plan may be handed off for preparation, but the new task must resolve its missing decisions before implementing it. Do not implement the work in the source conversation instead of creating the requested task.

Task creation must already be authorized by the user's request or an applicable authorized handoff. Do not ask for permission again when it has already been given. Creating the task does not grant permission for additional subagents, production changes, deployment or merge.

## Prepare the checkout

If the user requests a worktree, prepare or reuse the correct worktree **before** starting the task. Use `nimbou-skills:using-git-worktrees` when a new one is needed. Verify its base revision and the presence of the plan and other required artifacts. Uncommitted files do not appear automatically in another checkout; copy only what the authorized starting state requires and preserve unrelated changes.

## Create and start

1. Discover available native tools and their actual schemas. Use a native creation tool when it can express the required checkout, model and effort. Do not omit unsupported fields and assume they took effect.
2. Otherwise use `scripts/native_task.py create` through the existing local App Server. This is a direct creation path, available even when the MCP connector is healthy. See [the local API guide](references/local-api.md) for setup and commands. The helper sets `cwd`, `model` and `config.model_reasoning_effort` on `thread/start`, verifies the returned configuration, names the task and sends `turn/start` with the chosen model and effort.
3. Use one durable receipt for the operation. `--authorized` records authorization already given; it is not another approval gate. The helper persists intent and IDs before proceeding. Repeating the same request reads the existing task without submitting another prompt. Reconcile uncertain outcomes and stale locks against native state before retrying; never delete the receipt to force another creation.
4. Verify the native task ID, effective model/effort, checkout and observed turn state. Never silently substitute a model or claim an unverified effort.

If a native tool fails with a transport error, stop repeating that mutation and use the local API path. Read-only `inspect` distinguishes a stale bridge from an unavailable daemon. Do not restart shared sessions, extract bearer tokens, weaken authentication or rewrite global configuration merely to create a task.

## Report

Return the native task ID/name, verified model/effort, worktree and current state. Distinguish creation, a started turn, implementation progress and completion. If the connector failed but the native API worked, report successful task creation without claiming the old connector was repaired.
