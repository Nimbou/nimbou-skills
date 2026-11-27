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
if marketplace_output=$(codex plugin marketplace add "$REPO_ROOT" 2>&1); then
  printf '%s\n' "$marketplace_output"
elif [[ "$marketplace_output" == *"marketplace 'nimbou-skills' is already added from a different source"* ]] &&
  marketplace_list=$(codex plugin marketplace list --json) &&
  previous_source=$(node -e '
    const { marketplaces } = JSON.parse(require("node:fs").readFileSync(0, "utf8"))
    const source = marketplaces.find(({ name }) => name === "nimbou-skills")?.marketplaceSource
    if (source?.sourceType === "local") process.stdout.write(source.source)
  ' <<< "$marketplace_list") && [[ -n "$previous_source" ]]; then
  printf 'Switching the nimbou-skills marketplace from %s to %s.\n' "$previous_source" "$REPO_ROOT"
  codex plugin marketplace remove nimbou-skills
  if ! codex plugin marketplace add "$REPO_ROOT"; then
    codex plugin marketplace add "$previous_source" >&2 || printf 'Could not restore the previous marketplace registration.\n' >&2
    exit 1
  fi
else
  printf '%s\n' "$marketplace_output" >&2
  exit 1
fi
codex plugin add nimbou-skills@nimbou-skills
(cd "$REPO_ROOT" && npm_config_prefix="$HOME/.local" npm link)
npm_config_prefix="$HOME/.local" npm install -g @google/design.md
bash "$REPO_ROOT/scripts/setup-codex-full-wrapper.sh"
bash "$REPO_ROOT/scripts/setup-chrome-devtools-wrapper.sh"
bash "$REPO_ROOT/scripts/setup-codex-skills.sh"
bash "$REPO_ROOT/scripts/setup-python-docx.sh"
echo "Codex installation complete. Restart Codex to load the skills."
