# Create through the local App Server

This is a normal native-task creation path, not just a repair procedure. The bundled Unix-socket helper was verified against Codex 0.166.0. Use the installed CLI and its generated schema as the authority when the protocol differs.

## Runtime setup

The helper requires Python 3.10+ and `websockets==15.0.1`. Use an existing environment when available. Otherwise create a temporary venv, without changing global Python packages:

```bash
native_task_env="$(mktemp -d)"
python3 -m venv "$native_task_env"
"$native_task_env/bin/python" -m pip install websockets==15.0.1
```

Resolve `native_task_skill` to the directory containing this skill's `SKILL.md`. The local clone or a linked installation can supply it; do not assume a particular user's cache version or checkout.

The helper locates the existing server using `codex app-server daemon version` and its reported `socketPath`. Supply `--socket` **before** the subcommand only for an authoritative alternate Unix socket. The socket must exist and belong to the current OS user. The helper does not start a daemon, change permissions or perform OAuth.

## Create and start one task

Resolve the exact existing `task_checkout`, `task_model`, `task_effort`, `task_title`, `task_prompt_file`, and `task_receipt` from the authorized request. Use a persistent receipt under the task's plan directory or another approved artifact directory. Keep the same inputs and receipt when reconciling a retry.

```bash
"$native_task_env/bin/python" "$native_task_skill/scripts/native_task.py" create \
  --cwd "$task_checkout" \
  --model "$task_model" --effort "$task_effort" \
  --name "$task_title" --prompt-file "$task_prompt_file" \
  --receipt "$task_receipt" --authorized
```

The prompt file describes the task, authorized actions and restrictions. When executing a plan, also include the source checkout, plan path, target worktree and any pending decisions. The receipt contains a request fingerprint and IDs, not prompt text or credentials. A changed prompt is a different request: do not create another receipt to retry an uncertain original operation.

Mutation sequence: persist intent → `thread/start` (`cwd`, `model`, `config.model_reasoning_effort`, `ephemeral: false`) → persist native ID and verify returned configuration → `thread/name/set` → persist turn intent → `turn/start` (`model`, `effort`, `cwd`, text input) → persist turn ID → `thread/read` to verify identity and status. It does not override permissions, sandbox policy or service tier.

## Reconcile an interrupted creation

| Receipt phase | Meaning and next action |
|---|---|
| `creating`, no thread ID | The creation reply may have been lost. Inspect native task inventory for the requested checkout/name before any further creation. |
| `created` | Native ID is durable, but the turn was not started. Resolve configuration/name errors and inspect that same thread. |
| `starting` | Turn submission may have succeeded. Inspect that thread's turns; do not resend the prompt blindly. |
| `started` | A turn ID was returned. Read current status/messages to distinguish running, awaiting user input and finished. |

A repeat invocation with an existing ID performs only `thread/read`. `needsReconciliation: true` means the helper deliberately did not resume a partial operation. After a lost `thread/start` response or process crash, use native `thread/list`/`thread/turns/list` (current schema) to identify the outcome and update the receipt only from verified evidence. An interrupted process can leave the `.lock` directory: confirm no creator is active and reconcile before removing it.

## Optional connection diagnosis

```bash
"$native_task_env/bin/python" "$native_task_skill/scripts/native_task.py" inspect
```

Diagnosis is not a prerequisite to normal creation. `inspect` uses `CODEX_THREAD_ID` when present; supply `--thread` for a known native thread. It reads metadata without turns or message contents. `runtimeStatus: connected` is cached, so the helper also checks whether the reported loopback endpoint has a listener. An open port alone does not prove the MCP service works or authenticates correctly. No bridge entry may simply mean this thread has no TUI connector.

A stale MCP port with a healthy native socket does not prevent direct task creation. If the host exposes only another transport, inspect `codex app-server --help` and current schemas rather than weakening security or guessing addresses. Do not repeatedly submit a failed mutation or restart shared tasks.

## Protocol changes

The native control socket uses **WebSocket over Unix**, not raw newline-delimited JSON. `codex app-server proxy` does not by itself prove a JSONL transport. On each connection the helper sends `initialize`, acknowledges `initialized`, then correlates responses by ID while ignoring notifications. It refuses server-initiated command/permission requests instead of granting approval.

For unsupported methods or fields, generate schemas into a temporary directory with `codex app-server generate-json-schema --out ...` and inspect only the relevant request/response. The official [App Server reference](https://learn.chatgpt.com/docs/app-server) documents lifecycle and transports. `config/mcpServer/reload` queues a refresh for loaded threads; it neither restarts a dead TUI endpoint nor proves reconnection.
