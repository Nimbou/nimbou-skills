# Environment Discovery

How `browser-smoke` brings an application up without a per-project contract.

There is deliberately no configured command. A fixed one would tie the skill to a
single project and rot the moment the setup changes. The cost is that discovery can
fail — which is why Step 4's health check exists, and why a failure here is always an
environment concern and never a finding against the change.

## Order of discovery

1. **`package.json` scripts** — look for `dev`, `dev:web`, `start:dev`, `serve`. In a
   monorepo, the frontend workspace's script, not the root aggregate one. Prefer the
   root aggregate only when the frontend calls the API and both must run.
2. **The port.** Read it from the script, `nuxt.config.*`, `vite.config.*`, or
   `.env`. Never assume 3000 — a run in a worktree frequently collides with the main
   checkout's server already holding it. When the port is taken, start on another one
   and use it; do not kill whatever is listening.
3. **Environment file.** A worktree usually has no `.env`, only `.env.example`. Copy
   the example if that is all that is needed, and say you did. If it demands secrets
   you do not have, stop: that is an environment concern, and the smoke is skipped.
4. **Database.** If the app needs one, check that migrations are applied against
   whatever the `.env` points at. A worktree pointing at the main checkout's database
   is normal and acceptable for a smoke; a database missing this change's migration
   is an environment concern, not a defect.
5. **The API, for a fullstack change.** A frontend flow that calls a backend needs
   both up. Start the API the same way, and health-check it too.

## Bounded wait

Poll the base URL until it answers or **90 seconds** pass. Do not wait indefinitely,
and do not conclude "it works" from the process still being alive — a dev server that
compiles for two minutes and then crashes looks identical to a healthy one for the
first ninety seconds of its life.

Capture the server's stdout to a file in the scratchpad. When the health check fails,
the last twenty lines of that log usually name the reason, and that line belongs in
the concern.

## Cleanup

Stop every process you started, including on failure. A dev server left running holds
the port for the next run — which then starts on a different port, or fails
discovery, and reports an environment concern that this run caused.

## What is never worth doing here

- Installing dependencies the project does not already have
- Running migrations against a database you were not pointed at
- Editing `.env`, `nuxt.config`, or any project file to make the app start
- Killing a process you did not start

Each of these makes the smoke's own state a variable in the result. If the app cannot
come up within these limits, that is a real signal about the project's setup, and
reporting it plainly is more useful than a smoke that only ran because it mutated the
environment first.
