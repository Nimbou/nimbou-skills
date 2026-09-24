#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
for command_name in node pnpm npm codex; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Missing required command: $command_name" >&2
    exit 1
  fi
done
if [ "$(node -p "process.versions.node.split('.')[0]")" -lt 20 ]; then
  echo "Node >= 20 is required." >&2
  exit 1
fi
if ! codex plugin marketplace --help >/dev/null 2>&1; then
  echo "Codex marketplace support is required. Install Codex rust-v0.121.0+ or newer." >&2
  exit 1
fi
pnpm install --dir "$REPO_ROOT"
codex plugin marketplace add "$REPO_ROOT"
codex plugin add nimbou-skills@nimbou-skills
(cd "$REPO_ROOT" && npm_config_prefix="$HOME/.local" npm link)
npm_config_prefix="$HOME/.local" npm install -g @google/design.md
bash "$REPO_ROOT/scripts/setup-codex-full-wrapper.sh"
bash "$REPO_ROOT/scripts/setup-chrome-devtools-wrapper.sh"
bash "$REPO_ROOT/scripts/setup-codex-skills.sh"
bash "$REPO_ROOT/scripts/setup-python-docx.sh"
echo "Codex installation complete. Restart Codex to load the skills."
