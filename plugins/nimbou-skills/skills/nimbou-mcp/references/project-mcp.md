# Nimbou MCP — clone reference

Use this file after the discovery decision in `SKILL.md`. The current clone's
`config/mcp.php`, `.env.example`, routes, tests, OpenAPI/domain document, and
deployment runbook are authoritative. Never copy a hostname, path, port, client
ID, key, or migration blindly from another site.

## Discover the deployment values

From the repository root:

```bash
MCP_CONFIG="$(rg --files | rg '(^|/)config/mcp\.php$' | head -1)"
test -n "$MCP_CONFIG" && sed -n '1,120p' "$MCP_CONFIG"
rg -n 'MCP_OAUTH_ISSUER|MCP_OAUTH_RESOURCE|scopes|/mcp' \
  "$MCP_CONFIG" .env.example admin/.env.example docker-compose.yml README.md 2>/dev/null
```

Resolve `MCP_OAUTH_ISSUER` and `MCP_OAUTH_RESOURCE` from the active environment
and configuration. The standard template may default to a production issuer;
for local Docker, set both variables to the actual local admin base URL and its
`/mcp` resource in the ignored admin `.env`. Derive the port from the clone's
compose file or running service instead of assuming a fixed port.

After changing these values, use the actual service name from compose:

```bash
docker compose up -d db admin
docker compose exec admin php artisan config:clear
docker compose exec admin php artisan config:cache
```

If the clone uses different service names or a different bootstrap, follow its
README and adapt the commands without changing the application contract.

## OAuth endpoints and client registration

Given `MCP_ISSUER` and `MCP_RESOURCE` from the clone, the conventional endpoints
are:

| Purpose | Relative endpoint |
| --- | --- |
| Protected-resource metadata | `/.well-known/oauth-protected-resource/mcp` |
| Authorization-server metadata | `/.well-known/oauth-authorization-server` |
| Dynamic client registration | `/oauth/register` |
| Authorization | `/oauth/authorize` |
| Token / refresh | `/oauth/token` |
| Revocation | `/oauth/revoke` |
| JSON-RPC MCP | `/mcp` |

GET both metadata documents without credentials before registering a client.
Register a public client once, with a real callback owned by the client:

```bash
: "${MCP_ISSUER:?export the issuer read from this clone's config}"
: "${MCP_CALLBACK_URI:?export the exact callback URI your client listens on}"
curl --fail --silent --show-error "$MCP_ISSUER/oauth/register" \
  -H 'Content-Type: application/json' \
  --data "$(jq -n --arg callback "$MCP_CALLBACK_URI" \
    '{client_name:"Nimbou MCP client",redirect_uris:[$callback]}')"
```

The callback must use HTTPS or HTTP loopback (`localhost`/`127.0.0.1`) and have
no wildcard or fragment. The response contains a `client_id`, not a client
secret. Complete an authorization-code flow with a high-entropy `state`, a
43–128-character `code_verifier`, its URL-safe SHA-256 `code_challenge`,
`code_challenge_method=S256`, the exact registered callback, the exact resource,
and the smallest requested scope. Login and consent are interactive; a plain
CLI call cannot replace them. Exchange the callback code with form fields
`grant_type=authorization_code`, `client_id`, `code`, `redirect_uri`, and
`code_verifier`. Refresh with `grant_type=refresh_token`; revoke when disconnecting.

## Scope and MCP smoke request

The standard template exposes `mcp:read`, `mcp:write`, and `mcp:admin`; verify the
clone's discovery response before relying on that set. `mcp:write` requires
`mcp:read`; `mcp:admin` is independent and additionally requires a current
superadmin account. Access and refresh durations come from the clone's config or
runbook.

With a token loaded from a secret store (never echoed or shell-traced), start
with the read-only protocol catalog:

```bash
: "${MCP_RESOURCE:?export the exact MCP resource from this clone's config}"
: "${MCP_ACCESS_TOKEN:?load the access token from a secret store}"
curl --fail --silent --show-error "$MCP_RESOURCE" \
  -H "Authorization: Bearer ${MCP_ACCESS_TOKEN}" \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' \
  | jq .
unset MCP_ACCESS_TOKEN
```

Use `tools/list` rather than assuming a registry is unchanged across clones.
The standard tool groups are:

| Scope | Template tools |
| --- | --- |
| `mcp:read` | `list_modules`, `list_items`, `get_item` |
| `mcp:read mcp:write` | `create_item`, `update_item`, `delete_item`, `merge_items`, `list_history`, `restore` |
| `mcp:admin` | `list_module_definitions`, `get_module_definition`, `create_module`, `update_module`, `delete_module`, `list_users`, `get_user`, `list_permission_options`, `create_user`, `update_user`, `delete_user`, `get_email_configuration`, `update_email_configuration`, `get_tags_configuration`, `update_tags_configuration` |

Treat the table as a compatibility hint, not an authorization source.

## Safe command behavior

Read the target and current revision before writing. Prefer `dry_run` for tools
that expose it and send the smallest explicit patch. Omitted keys mean “leave
unchanged”; an explicit empty value may mean “clear” or “preserve” according to
the clone's contract. Destructive content/module operations and user deletion
require a fresh confirmation token bound to the same actor, client, arguments,
and target. Never fabricate or replay one, and never manage superadministrator
accounts. On `REVISION_CONFLICT`, re-read; on `SUPERADMIN_REQUIRED`,
`CONFIRMATION_REQUIRED`, `CONFIRMATION_EXPIRED`, or `VALIDATION_FAILED`, follow
the structured error instead of bypassing the guard. Passwords, tokens, and raw
exception details must remain redacted.

## Production rollout

Locate and read the clone's deployment runbook before changing production. Use
its exact migration allowlist and commands; discover names from the runbook and
`admin/database/migrations` rather than hardcoding a source site's filenames.
The safe shape is:

1. Back up the persistent Passport key pair and OAuth/audit tables.
2. After extraction, run the runbook's migration command from the admin root and
   verify every expected migration as `Ran`.
3. Run `php artisan config:clear` followed by `php artisan config:cache`.
4. Verify both discovery documents, the `401` challenge on `/mcp`, and an audit
   query selecting operational columns only (actor/client, operation, target,
   result, timestamp), never snapshot payloads containing secrets.

Do not use `migrate:fresh`, `passport:keys`, a temporary public PHP/HTTP helper,
or an unapproved rollback. If hosting is FTP-only, ask the host to execute the
documented CLI migration. Do not announce availability until the runbook's
checks and backup evidence are recorded.

For code changes, locate the clone's focused MCP/OAuth tests and formatter, then
run those exact commands. Do not replace scoped verification with the entire
Laravel suite or an unrelated frontend check.
