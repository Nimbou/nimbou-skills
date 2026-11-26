# Create from Codex CLI through an existing local App Server

Use this route from CLI/TUI when its native creation tool cannot target the required checkout or permissions and an existing App Server serves the active thread. Codex Desktop itself uses native creation as described in [the skill](../SKILL.md). Keep the existing App Server and session configuration intact. If a suitable server is unavailable, stop before preparing the checkout. The bundled Unix-socket helper was verified against Codex 0.166.0. Use the installed CLI and its generated schema as the authority when the protocol differs.

## Runtime setup

The connection helper requires Python 3.10+, Unix sockets, Unix user IDs and `websockets==15.0.1`. The `detect` subcommand requires only Python. Use an existing environment when available. Otherwise create a temporary venv, without changing global Python packages:

```bash
native_task_env="$(mktemp -d)"
python3 -m venv "$native_task_env"
"$native_task_env/bin/python" -m pip install websockets==15.0.1
```

Resolve `native_task_skill` to the directory containing this skill's `SKILL.md`. The local clone or a linked installation can supply it; do not assume a particular user's cache version or checkout.

The helper locates the existing server using the read-only `codex app-server daemon version` command and its reported `socketPath`. Supply `--socket` **before** the subcommand only for an authoritative socket of an already-running server. The socket must exist and belong to the current OS user. Never start or restart a server to obtain a socket for this workflow.

## Create and start one task

Follow the checkout preparation in `SKILL.md` before running `create`. Use `nimbou-skills:using-git-worktrees` for a new worktree and pass the verified checkout path as `task_checkout`. Resolve `task_model` and `task_effort` from the authorized request/handoff, defaulting to `gpt-6.2-sol` and `low`; the CLI also uses these defaults when the flags are omitted. Resolve `task_title`, `task_prompt_file`, and `task_receipt`. Use a persistent receipt under the task's plan directory or another approved artifact directory. Keep the same inputs and receipt when reconciling a retry.

```bash
"$native_task_env/bin/python" "$native_task_skill/scripts/native_task.py" create \
  --cwd "$task_checkout" \
  --model "$task_model" --effort "$task_effort" \
  --name "$task_title" --prompt-file "$task_prompt_file" \
  --receipt "$task_receipt" --authorized
```

The prompt file describes the task, authorized actions and restrictions. When executing a plan, also include the source checkout, plan path, target worktree and any pending decisions. The receipt contains a request fingerprint and IDs, not prompt text or credentials. A changed prompt is a different request: do not create another receipt to retry an uncertain original operation.

Mutation sequence: persist intent → `thread/start` (`cwd`, `model`, `config.model_reasoning_effort`, `sandbox: "danger-full-access"`, `approvalPolicy: "never"`, `ephemeral: false`) → persist native ID and effective configuration → verify model, effort, checkout, `sandbox: {"type": "dangerFullAccess"}` and `approvalPolicy: "never"` → `thread/name/set` → persist turn intent → `turn/start` (`model`, `effort`, `cwd`, `sandboxPolicy: {"type": "dangerFullAccess"}`, `approvalPolicy: "never"`, text input) → persist turn ID → `thread/read` to verify identity and status. A missing or mismatched permission response stops before the first turn while keeping the receipt and native ID. Full Access is mandatory; the helper never falls back to restricted permissions. It does not change global configuration or service tier.

## Reconcile an interrupted creation

| Receipt phase | Meaning and next action |
|---|---|
| `creating`, no thread ID | The creation reply may have been lost. Inspect native task inventory for the requested checkout/name before any further creation. |
| `created` | Native ID is durable, but the turn was not started. Resolve configuration/name errors and inspect that same thread. |
| `starting` | Turn submission may have succeeded. Inspect that thread's turns; do not resend the prompt blindly. |
| `started` | A turn ID was returned. Read current status/messages to distinguish running, awaiting user input and finished. |

A repeat invocation with an existing ID performs only `thread/read`. `needsReconciliation: true` means the helper deliberately did not resume a partial operation or the receipt lacks verified Full Access settings (including receipts created before this requirement). After a lost `thread/start` response or process crash, use native `thread/list`/`thread/turns/list` (current schema) to identify the outcome and update the receipt only from verified evidence. An interrupted process can leave the `.lock` directory: confirm no creator is active and reconcile before removing it.

## Connection diagnosis

```bash
"$native_task_env/bin/python" "$native_task_skill/scripts/native_task.py" inspect
```

Run `inspect` before creating a checkout or task. Verify reachability and identity using the current CLI/TUI thread ID (the default `CODEX_THREAD_ID` or explicit `--thread <id>`). Match the returned ID and checkout to the active session. `inspect --thread ""` checks reachability only. The helper reads metadata without turns or message contents and can compare cached bridge status with the loopback listener.

Run `python <skill-dir>/scripts/native_task.py detect` separately for launcher classification. It checks allowlisted values of `CODEX_INTERNAL_ORIGINATOR_OVERRIDE` and emits only the classification. The variable is a launcher hint and may be absent on a standard CLI launch. Prefer active host metadata when available. A thread can be reopened in a different client, so its recorded origin and bridge status are useful only for diagnosis. See the [Codex originator implementation](https://github.com/openai/codex/blob/main/codex-rs/login/src/auth/default_client.rs).

A reachable socket alone is insufficient. If the current session cannot be matched to the server, report the missing evidence. After creation, use the CLI/TUI thread reader or inventory to verify the new ID and turn. Reconcile any uncertain creation before retrying.

## Protocol changes

The native control socket uses **WebSocket over Unix**, not raw newline-delimited JSON. `codex app-server proxy` does not by itself prove a JSONL transport. On each connection the helper sends `initialize`, acknowledges `initialized`, then correlates responses by ID while ignoring notifications. It refuses server-initiated command/permission requests instead of granting approval.

For unsupported methods or fields, generate schemas into a temporary directory with `codex app-server generate-json-schema --out ...` and inspect only the relevant request/response. The official [App Server reference](https://learn.chatgpt.com/docs/app-server) documents lifecycle and transports. `config/mcpServer/reload` queues a refresh for loaded threads; it neither restarts a dead TUI endpoint nor proves reconnection.
