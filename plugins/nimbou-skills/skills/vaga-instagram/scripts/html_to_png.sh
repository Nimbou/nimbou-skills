#!/usr/bin/env bash
# html_to_png.sh — render a fixed-size HTML art to a PNG at exact pixel size.
#
# Usage: html_to_png.sh <input.html> <output.png> <width> <height>
#
# Requires headless Chrome/Chromium. The flag set below captures the page at
# the exact requested size (no footer clipping, no scrollbars, scale 1) and
# waits for web fonts via a virtual-time budget. Validates the output size.
set -euo pipefail

IN="${1:?usage: html_to_png.sh <input.html> <output.png> <width> <height>}"
OUT="${2:?usage: html_to_png.sh <input.html> <output.png> <width> <height>}"
W="${3:?width required}"
H="${4:?height required}"

[ -f "$IN" ] || { echo "error: input HTML not found: $IN" >&2; exit 1; }
mkdir -p "$(dirname "$OUT")"

abspath() { case "$1" in /*) printf '%s' "$1";; *) printf '%s/%s' "$PWD" "$1";; esac; }
IN_ABS="$(abspath "$IN")"

find_bin() { for b in "$@"; do command -v "$b" >/dev/null 2>&1 && { printf '%s' "$b"; return 0; }; done; return 1; }
CHROME="$(find_bin google-chrome google-chrome-stable chromium chromium-browser chrome)" \
  || { echo "error: headless Chrome/Chromium not found" >&2; exit 1; }

# Headless Chrome shrinks the real viewport when --window-size matches the art
# exactly (window chrome is subtracted), which reflows the layout and clips the
# footer. Render with generous extra height, then crop to the exact size — the
# template body has a fixed CSS size with overflow:hidden, so cropping is safe.
RAW="$(mktemp --suffix=.png)"
trap 'rm -f "$RAW"' EXIT

"$CHROME" --headless=new --disable-gpu --no-sandbox \
  --hide-scrollbars --force-device-scale-factor=1 \
  --window-size="$W,$((H + 400))" --virtual-time-budget=8000 \
  --screenshot="$RAW" "file://$IN_ABS" 2>&1 \
  | grep -v -i 'shared_memory' || true

[ -s "$RAW" ] || { echo "error: Chrome produced no screenshot for $IN" >&2; exit 1; }

python3 - "$RAW" "$OUT" "$W" "$H" <<'EOF'
import sys
raw, out, w, h = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
try:
    from PIL import Image
except ImportError:
    sys.exit("error: python3-pillow is required to crop the render (pip install pillow)")
im = Image.open(raw)
if im.width < w or im.height < h:
    sys.exit(f"error: render {im.width}x{im.height} smaller than requested {w}x{h}")
im.crop((0, 0, w, h)).save(out)
print(f"ok: {out} {w}x{h}")
EOF
