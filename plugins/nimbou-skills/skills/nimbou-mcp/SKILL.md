---
name: nimbou-mcp
description: Use when working with a cloned Nimbou/Laravel site's MCP server, including local setup, OAuth client connection, content operations, administrative tools, or production rollout checks.
---

# Nimbou MCP

Use this skill for the MCP server provided by the Nimbou CMS/Laravel site
template. It covers both connecting as an MCP client and configuring or
validating the server. It does not configure an unrelated Codex connector or
authorize production changes by itself.

## Discover the current site first

1. Resolve the repository root with `git rev-parse --show-toplevel`. Locate the
   site's `config/mcp.php`, normally `admin/config/mcp.php`, and confirm the
   matching MCP controller, routes, `.env.example`, Docker service, tests, and
   runbook. Do not assume the source site's directory or hostname.
2. Identify the target explicitly: local or the issuer/resource read from the
   current site's configuration and discovery metadata. If the user did not name
   an environment, use local for mutations and never guess a production host.
3. Classify the request as connection/use, code/configuration, or production
   rollout. Read only the relevant section of
   [references/project-mcp.md](references/project-mcp.md), then consult the
   clone's own OpenAPI/domain and deployment documents when present.

## Connection and use

- Prefer an already-configured native MCP client. Otherwise follow the OAuth
  2.1 authorization-code flow with PKCE `S256` in the reference; do not invent
  bearer tokens or pretend a CLI request completed the interactive login.
- Discover the protected resource and authorization server before registration.
  Register a public client once with an HTTPS or loopback callback; callbacks
  cannot contain wildcards or fragments.
- Request the smallest scope exposed by the current configuration: in the
  standard template, `mcp:read` is for reads, `mcp:read mcp:write` is for
  content writes, and `mcp:admin` is independent for administrative tools.
  Administrative calls require the token owner to be a current superadmin
  (`accounts_types_id = 1`). Use `tools/list` as the runtime source of truth.
- Keep access/refresh credentials in the client's secret store or process
  environment. Never commit, print, paste, or put them in audit payloads.

## Safe operations

- Read the target and current revision before any write. Use `dry_run` where the
  tool offers it, and treat `revision` conflicts as a signal to re-read.
- Deletion, merge, destructive module changes, and user deletion require a
  confirmation token returned by the preview flow. Never fabricate, replay, or
  silently reuse one. Do not manage superadministrator accounts.
- Omitted patch keys mean “leave unchanged”; an explicit empty value may mean
  “clear” or “preserve” according to the tool contract. Do not normalize these
  cases yourself.
- If a command returns `SUPERADMIN_REQUIRED`, `CONFIRMATION_REQUIRED`,
  `CONFIRMATION_EXPIRED`, `REVISION_CONFLICT`, or `VALIDATION_FAILED`, report
  the structured error and take the corresponding safe next step; never bypass
  the guard. Passwords, tokens, and raw exception details must stay redacted.

## Configure and roll out

- For local setup, use the clone's `README.md`, `.env.example`, Docker compose,
  and any hand-written CMS database bootstrap it documents. Create ignored
  secrets/configuration files only as that bootstrap requires. Override any
  production-default issuer/resource for local use, then clear/rebuild
  Laravel's config cache after changing them.
- For production, follow the clone's runbook exactly: preserve the Passport key
  pair, run the migrations it lists after extraction, verify discovery and
  operational audit columns, and do not use `migrate:fresh`, `passport:keys`,
  ad-hoc HTTP helpers, or an unapproved rollback.
- For code/configuration changes, use
  `nimbou-skills:test-driven-development` before implementation and
  `nimbou-skills:verification-before-completion` before claiming success. Run
  the clone's scoped MCP/OAuth tests and formatter, not the entire Laravel suite
  as an implicit acceptance gate.
