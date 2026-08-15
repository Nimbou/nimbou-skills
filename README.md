# nimbou-skills

`nimbou-skills` is the canonical skill library for `Claude Code`, `Codex`, and `VS Code Copilot Chat`. It ships a backend-first core for `NestJS`, `Prisma`, `Clean Architecture`, and `SOLID`, plus Nuxt/Vuetify skills and Codex-only mirrors for Claude command workflows under `.codex/skills/`.

This fork consolidates:
- backend-first workflow skills
- NestJS auditing skills
- Nuxt/Vuetify skills
- Claude commands and Codex integration

## Skill Model

- Supported harnesses: `Claude Code` and `Codex`
- VS Code integration: shared skills in `~/.copilot/skills` and agents in `~/.config/Code/User/prompts`
- Default architecture bias: `NestJS + Prisma + Clean Architecture + SOLID`
- Use `nestjs-*` for backend-first work and `nuxt-*` for Nuxt-specific work

### Core workflow skills

- `change-spec`
- `feat-spec`
- `doc-domain`
- `doc-gherkin`
- `doc-openapi`
- `doc-approval`
- `nestjs-think`
- `nestjs-plan`
- `nestjs-refactor`
- `fullstack-plan`
- `executing-plans`
- `dispatching-parallel-agents`
- `test-driven-development`
- `e2e-test-quality`
- `browser-smoke` verifies a change's promised flows in a real browser, standalone or as `executing-plans` Step 5
- `nestjs-debug` backend-first debugging for NestJS/Prisma work
- `verification-before-completion`
- `request-review`
- `apply-review`
- `using-git-worktrees`
- `finishing-a-development-branch`
- `writing-skills`

### NestJS-specific skills

- `nestjs-refactor`
- `nestjs-test`

### Nuxt-specific skills

- `nuxt-think`
- `nuxt-plan`
- `nuxt-catalog`
- `nuxt-audit`
- `nuxt-test`
- `nuxt-debug`

### Nimbou-site skills (Laravel shell + Nuxt SPA + nimbou-cms)

- `scaffold-nimbou-site` bootstraps a new site from the starter, green locally
- `theming-nimbou-site` applies a client's visual identity to a scaffolded site
- `laravel-think` / `laravel-plan` / `laravel-execute` design, plan and build a nimbou-cms content module
- `nimbou-cms-seed` / `nimbou-cms-wire` load module content and wire it to the SPA
- `nimbou-seo-migrate` builds the 301 redirect map for a domain cutover
- `deploy-nimbou-site` deploys a nimbou site to cPanel shared hosting (FTP-only, MariaDB), first go-live or redeploy
- `golive-nimbou-site` activates the SEO cutover on the real domain (canonical, real-domain 301 re-check, sitemap→Search Console)

## Repository Layout

- `plugins/nimbou-skills/skills/` — shared skill library
- `plugins/nimbou-skills/agents/` — auxiliary review and auditing agents
- `plugins/nimbou-skills/commands/` — Claude command entrypoints such as `/design-md` and `/merge-pr`
- `plugins/nimbou-skills/workflows/` — Claude Code dynamic workflows such as `/nimbou-skills:run-waves` (Claude Code only; Codex does not run these)
- `~/.codex/skills/` — Codex skill links installed from the shared library and command mirrors
- `.codex/skills/` — Codex-only mirrors for the Claude command workflows
- `.agents/plugins/marketplace.json` — repo-scoped Codex marketplace catalog
- `.claude-plugin/marketplace.json` — marketplace manifest for `claude plugin marketplace add`
- `docs/plans/` — generated plans and design artifacts
- `tests/` — skill tree, install flow, and catalog coverage

## Installation

Clone the repository once into `/var/www` and run the single bootstrap script:

```bash
cd /var/www
git clone <your-fork-url> nimbou-skills
cd /var/www/nimbou-skills
./install.sh
```

The bootstrap script:
- runs `pnpm install`
- registers and installs the Claude Code plugin
- installs the same plugin into GitHub Copilot CLI from the local repo path
- links the shared skills and Codex command mirrors into `~/.copilot/skills` for VS Code Copilot Chat
- links the review and auditing agents into `~/.config/Code/User/prompts` and `~/.config/Code/User/prompts/agents`
- links the shared skills and Codex command mirrors into `~/.codex/skills`
- compares the installed Claude Code plugin version against `plugins/nimbou-skills/.claude-plugin/plugin.json` and skips reinstall when it already matches
- requires Codex `rust-v0.121.0+` or newer for marketplace installation
- registers the Codex marketplace from the repository root, backed by `.agents/plugins/marketplace.json`, and marks `nimbou-skills` as installed by default
- runs `npm link` for `nb-catalog`
- installs `@google/design.md` globally into the same local npm prefix so `design.md lint` is available
- creates `~/.local/bin/codex-full` when missing, wired to `codex --dangerously-bypass-approvals-and-sandbox`
- creates `~/.local/bin/chrome-devtools-mcp-wayland` and rewrites `~/.codex/config.toml` so the `chrome-devtools` MCP inherits the local X/Wayland session automatically

If your installed Codex build does not support `codex plugin marketplace add`, upgrade to `rust-v0.121.0+` or newer and rerun `./install.sh`.

After the bootstrap finishes, restart Claude Code and Codex, then reload VS Code so VS Code Copilot Chat picks up the updated skills and agents.
If Codex already had a session open, close it fully and start a new one so it reloads `~/.codex/skills`.

### Installation (Windows / PowerShell)

On Windows, run the PowerShell bootstrap instead of `install.sh` (PowerShell 7+ required):

```powershell
cd C:\www
git clone <your-fork-url> nimbou-skills
cd C:\www\nimbou-skills
pwsh -File .\install.ps1
```

`install.ps1` mirrors the Linux flow with these Windows-specific differences:
- installs `nb-catalog` and `@google/design.md` under the npm prefix `%USERPROFILE%\.local`, and adds that directory to your user `PATH`
- links the shared skills and Codex command mirrors into `%USERPROFILE%\.codex\skills` and `%USERPROFILE%\.copilot\skills` as directory junctions (no administrator or Developer Mode required)
- copies the review and auditing agents into `%APPDATA%\Code\User\prompts` and `%APPDATA%\Code\User\prompts\agents` (Windows cannot junction individual files)
- creates `%USERPROFILE%\.local\codex-full.cmd`, wired to `codex --dangerously-bypass-approvals-and-sandbox`
- skips the `chrome-devtools-mcp-wayland` wrapper and the `config.toml` rewrite, which are specific to Linux Wayland/X11 sessions

After it finishes, restart Claude Code, Codex, and VS Code, and open a new terminal so the updated `PATH` takes effect.

## Nuxt Catalog Workflow

The Nuxt domain uses a shared machine-level catalog workflow:

```bash
cd /path/to/project
nb-catalog validate
nb-catalog generate
```

Optional domain filtering stays available:

```bash
nb-catalog generate projects
```

This workflow writes `components.meta.json` and `.generated/component-catalog/components.meta.json`.

`nuxt-catalog` defaults to `validate -> generate` and runs the bundled generator from this repository via `CATALOG_ROOT`.

If a project wants a copied local fallback instead of depending on `/var/www/nimbou-skills` at runtime, copy `skills/nuxt-catalog/` into `.claude/skills/nuxt-catalog/` and run `.claude/skills/nuxt-catalog/scripts/install.sh <project-root>`.

## Notes

- `/design-md` and `/merge-pr` stay as Claude commands, with matching Codex mirrors in `.codex/skills/`.
- `/design-md` validates generated `DESIGN.md` files with the official Google CLI via `design.md lint` (or `npx @google/design.md lint` as fallback).
- `change-spec` handles mixed changes over existing flows and returns one combined frontend/backend plan with explicit impact mapping, without generating spec files.
- `feat-spec` is the mixed-request entry point for new feature slices or new backend contracts. It closes the shared feature contract and ownership boundary first, then hands backend contract closure to `nestjs-think`. Frontend-only requests stay in `nuxt-think`; backend-only requests stay in `nestjs-think`.
- `nestjs-think` keeps backend contract and persistence viability together, including Prisma/schema impact when relevant, instead of splitting data modeling into a separate default step.
- `doc-openapi` publishes the canonical HTTP transport artifact beside `domain.md` and the approved `.feature` files after `nestjs-think` and before `nuxt-think`.
- `doc-approval` turns a domain spec (`domain.md` + `*.feature`) into a non-technical approval PDF for a business sponsor, translating the Gherkin scenarios into plain business language and keeping the source HTML beside the spec for re-generation.
- `nestjs-think` and `nestjs-plan` stay backend-first; `nuxt-think` and `nuxt-plan` cover Nuxt planning.
- `fullstack-plan` produces ONE wave-structured plan for work spanning both stacks, so frontend tasks run in the same waves as backend tasks instead of queueing behind them. A frontend task depends on the approved `openapi.yaml`, never on a backend task; two separate plans serialize work that has no dependency between it. It composes rather than duplicates — platform rules stay in `nestjs-plan` and `nuxt-plan`, and this skill owns only the wave topology across the two.
- `nestjs-refactor` is the structural cleanup workflow for existing NestJS backends that need SOLID and Clean Architecture restoration in bounded batches.
- `nestjs-test` handles Gherkin-driven backend coverage, audit routing, and backend test stabilization.
- `nestjs-debug` handles NestJS, Prisma, and boundary failures across controller, use-case, repository, and transaction layers.
- `nuxt-debug` is the Codex browser-debugging flow; `nuxt-test` turns the result into bounded coverage; `browser-smoke` is neither — it verifies once, right after building, that what a change promised actually happens on screen, and writes no tests.
- `nuxt-audit` is the single frontend review pass; `executing-plans` runs wave-structured plans by fanning each wave's tasks out to parallel implementer subagents, committing once per wave, and collecting non-blocking spec-compliance findings into an end-of-plan follow-ups artifact. It runs **no code review**: `/code-review` over the branch covers that axis better in one pass than N per-wave passes. The spec reviewer stays because it holds the plan — it is the only thing that can tell a requirement never implemented from one never requested.
- `executing-plans` is split by harness: `SKILL.md` owns Step 1 and the routing decision, `prose-execution.md` holds Steps 2-5 for Codex, and `/nimbou-skills:run-waves` runs the same Steps 2-5 as a Claude Code workflow. Keeping the executable body out of `SKILL.md` is what stops Claude from walking the slow prose path by default.
- `prose-execution.md` is normative. `workflows/run-waves.js` mirrors it; when the two disagree, the prose file wins. Step 1 always runs in conversation, since a workflow takes no user input mid-run.
- `e2e-test-quality` covers broader end-to-end reliability beyond one Nuxt module slice.
- This fork intentionally removed upstream bootstrap hooks and unsupported harness integrations.

## License

MIT License. See `LICENSE`.
