#!/usr/bin/env bash

set -euo pipefail

TARGET_PATH="${CHROME_DEVTOOLS_MCP_WRAPPER_PATH:-$HOME/.local/bin/chrome-devtools-mcp-wayland}"
CODEX_CONFIG_PATH="${CODEX_CONFIG_PATH:-$HOME/.codex/config.toml}"

mkdir -p "$(dirname "$TARGET_PATH")"
mkdir -p "$(dirname "$CODEX_CONFIG_PATH")"

cat >"$TARGET_PATH" <<'EOF'
#!/usr/bin/env bash

set -euo pipefail

export DISPLAY="${DISPLAY:-:0}"
export WAYLAND_DISPLAY="${WAYLAND_DISPLAY:-wayland-0}"
export XDG_SESSION_TYPE="${XDG_SESSION_TYPE:-wayland}"
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"

if [[ -z "${XAUTHORITY:-}" ]]; then
  auth_file="$(find "$XDG_RUNTIME_DIR" -maxdepth 1 -name '.mutter-Xwaylandauth.*' -print -quit 2>/dev/null || true)"
  if [[ -n "$auth_file" ]]; then
    export XAUTHORITY="$auth_file"
  fi
fi

exec npx -y chrome-devtools-mcp@latest "$@"
EOF

chmod +x "$TARGET_PATH"

node --input-type=module - "$CODEX_CONFIG_PATH" "$TARGET_PATH" <<'EOF'
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const [, , configPath, wrapperPath] = process.argv;

let content = existsSync(configPath) ? readFileSync(configPath, 'utf8') : '';
const normalizedBlock = `[mcp_servers.chrome-devtools]\ncommand = "${wrapperPath}"\nargs = []\n`;
const blockPattern = /^\[mcp_servers\.chrome-devtools\]\r?\n(?:(?!\[)[^\r\n]*\r?\n)*/m;

if (blockPattern.test(content)) {
  content = content.replace(blockPattern, `${normalizedBlock}\n`);
} else if (content.includes('[mcp_servers.chrome-devtools.tools.')) {
  content = content.replace(
    /\n(?=\[mcp_servers\.chrome-devtools\.tools\.)/,
    `\n${normalizedBlock}`,
  );
} else {
  if (content.length > 0 && !content.endsWith('\n')) content += '\n';
  if (content.length > 0) content += '\n';
  content += normalizedBlock;
}

writeFileSync(configPath, content);
EOF

echo "Configured Chrome DevTools MCP wrapper: $TARGET_PATH"
echo "Updated Codex config: $CODEX_CONFIG_PATH"
