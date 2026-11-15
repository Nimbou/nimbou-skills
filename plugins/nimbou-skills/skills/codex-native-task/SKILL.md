---
name: codex-native-task
description: Use when the user asks to create or start a native Codex task, including a separate task to execute a plan with a specified model, reasoning effort or Git worktree.
---

# Create a Native Codex Task

Create and start the requested persistent Codex task directly. This is the ordinary creation workflow: it does not require a connector failure first. The result is a native thread visible in Codex, not a collaboration subagent or a headless `codex exec` substitute.

## Close the handoff

Resolve the task's purpose, target checkout, requested model and reasoning effort from the conversation and applicable model policy. Carry forward scope, validation preferences, unresolved decisions and subagent restrictions. Ask only for information that cannot be inferred and materially affects creation.

Default to `gpt-6.1-sol` with `low` reasoning unless the user or an explicitly authorized handoff specifies another model/effort. This native-task controller default is an explicit exception to the library's GPT-6 Sol ceiling in `AGENTS.md`; it does not change worker dispatch rules in other skills.

Always create with **Full Access**: `sandbox: "danger-full-access"` and `approvalPolicy: "never"`. Verify both effective values before starting the first turn. If the environment rejects or changes them, preserve the receipt and native ID, report the mismatch and do not start the turn or silently fall back to restricted access. Do not change global configuration.

For a plan-execution task, include the saved plan path and source checkout. A draft plan may be handed off for preparation, but the new task must resolve its missing decisions before implementing it. Do not implement the work in the source conversation instead of creating the requested task.

Task creation must already be authorized by the user's request or an applicable authorized handoff. Do not ask for permission again when it has already been given. Creating the task does not grant permission for additional subagents, production changes, deployment or merge.

## Prepare the checkout

Create a separate Git worktree **by default, before** starting the task. Reuse an existing worktree only when it is already dedicated to this same task (including retries); use the source checkout only when explicitly requested. Use `nimbou-skills:using-git-worktrees` when a new one is needed. Prefer the managed native worktree tool when available, wait for its completion and verify the returned path. Resolve the base revision from the requested branch/plan or the source checkout's current HEAD and pass it explicitly; do not inherit a tool's remote-default-branch assumption. Verify the base revision and the presence of the plan and other required artifacts. Uncommitted files do not appear automatically in another checkout; copy only what the authorized starting state requires and preserve unrelated changes. If isolation cannot be prepared, stop before creating the task and report the blocker.

## Create and start

1. Discover available native tools and their actual schemas. Use a native creation tool only when it can express and verify the required worktree checkout, model, effort and Full Access settings before starting a turn. Do not omit unsupported fields and assume they took effect.
2. Otherwise use `scripts/native_task.py create` through the existing local App Server. This is a direct creation path, available even when the MCP connector is healthy. See [the local API guide](references/local-api.md) for setup and commands. The helper sets `cwd`, `model`, `config.model_reasoning_effort`, `sandbox` and `approvalPolicy` on `thread/start`, verifies the returned configuration, names the task and sends `turn/start` with the chosen model/effort and explicit Full Access policies.
3. Use one durable receipt for the operation. `--authorized` records authorization already given; it is not another approval gate. The helper persists intent and IDs before proceeding. Repeating the same request reads the existing task without submitting another prompt. Reconcile uncertain outcomes and stale locks against native state before retrying; never delete the receipt to force another creation.
4. Verify the native task ID, effective model/effort, Full Access policies, worktree checkout and observed turn state. Never silently substitute a model or claim an unverified effort or permission setting.

If a native tool fails with a transport error, stop repeating that mutation and use the local API path. Read-only `inspect` distinguishes a stale bridge from an unavailable daemon. Do not restart shared sessions, extract bearer tokens, weaken authentication or rewrite global configuration merely to create a task.

## Report

Return the native task ID/name, verified model/effort, Full Access policies, worktree and current state. Distinguish creation, a started turn, implementation progress and completion. If the connector failed but the native API worked, report successful task creation without claiming the old connector was repaired.
