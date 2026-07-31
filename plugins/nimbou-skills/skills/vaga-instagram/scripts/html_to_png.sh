#!/usr/bin/env bash
# html_to_png.sh — render a fixed-size HTML art to a PNG at exact pixel size.
#
# Usage: html_to_png.sh <input.html> <output.png> <width> <height>
#
# Requires headless Chrome/Chromium. On Windows (Git Bash) it also looks for
# chrome.exe in the usual install paths — `command -v chrome` does not find it.
set -euo pipefail

IN="${1:?usage: html_to_png.sh <input.html> <output.png> <width> <height>}"
OUT="${2:?usage: html_to_png.sh <input.html> <output.png> <width> <height>}"
W="${3:?width required}"
H="${4:?height required}"

[ -f "$IN" ] || { echo "error: input HTML not found: $IN" >&2; exit 1; }
mkdir -p "$(dirname "$OUT")"

# Absolute = POSIX (/x) or Windows drive-letter (C:/x, C:\x).
abspath() { case "$1" in /* | [A-Za-z]:[/\\]*) printf '%s' "$1";; *) printf '%s/%s' "$PWD" "$1";; esac; }
IN_ABS="$(abspath "$IN")"
OUT_ABS="$(abspath "$OUT")"

find_bin() { for b in "$@"; do command -v "$b" >/dev/null 2>&1 && { printf '%s' "$b"; return 0; }; done; return 1; }
CHROME="$(find_bin google-chrome google-chrome-stable chromium chromium-browser chrome || true)"
if [ -z "$CHROME" ]; then
  # Windows: chrome.exe is not on PATH.
  for c in \
    "/c/Program Files/Google/Chrome/Application/chrome.exe" \
    "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe" \
    "${LOCALAPPDATA:-}/Google/Chrome/Application/chrome.exe" \
    "/c/Program Files/Microsoft/Edge/Application/msedge.exe"; do
    [ -x "$c" ] && { CHROME="$c"; break; }
  done
fi
[ -n "$CHROME" ] || { echo "error: headless Chrome/Chromium not found" >&2; exit 1; }

# chrome.exe (Windows build) does not understand MSYS paths like /c/www/... —
# it writes a file with the literal name. Convert both paths when possible.
IS_EXE=false; case "$CHROME" in *.exe) IS_EXE=true;; esac
if $IS_EXE && command -v cygpath >/dev/null 2>&1; then
  IN_ABS="$(cygpath -m "$IN_ABS")"
  OUT_ABS="$(cygpath -m "$OUT_ABS")"
fi

# Two render modes:
#  A) python3 + Pillow available → render taller and CROP to the exact size.
#     Some headless builds subtract window chrome from --window-size, which
#     reflows the page and clips the footer; the crop immunizes against that.
#  B) no Pillow (typical on Windows) → render at the exact --window-size. Works
#     on Chrome 120+ with --headless=new. The mandatory visual check in step 5
#     of SKILL.md is what catches a clipped footer in this mode.
if command -v python3 >/dev/null 2>&1 && python3 -c 'import PIL' >/dev/null 2>&1; then
  RAW="$(mktemp --suffix=.png)"
  trap 'rm -f "$RAW"' EXIT
  RAW_ARG="$RAW"
  $IS_EXE && command -v cygpath >/dev/null 2>&1 && RAW_ARG="$(cygpath -m "$RAW")"

  "$CHROME" --headless=new --disable-gpu --no-sandbox \
    --hide-scrollbars --force-device-scale-factor=1 \
    --window-size="$W,$((H + 400))" --virtual-time-budget=8000 \
    --screenshot="$RAW_ARG" "file:///$IN_ABS" 2>&1 \
    | grep -v -i 'shared_memory' || true

  [ -s "$RAW" ] || { echo "error: Chrome produced no screenshot for $IN" >&2; exit 1; }

  python3 - "$RAW" "$OUT" "$W" "$H" <<'EOF'
import sys
from PIL import Image
raw, out, w, h = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
im = Image.open(raw)
if im.width < w or im.height < h:
    sys.exit(f"error: render {im.width}x{im.height} smaller than requested {w}x{h}")
im.crop((0, 0, w, h)).save(out)
print(f"ok: {out} {w}x{h}")
EOF
else
  "$CHROME" --headless=new --disable-gpu --no-sandbox \
    --hide-scrollbars --force-device-scale-factor=1 \
    --window-size="$W,$H" --virtual-time-budget=8000 \
    --screenshot="$OUT_ABS" "file:///$IN_ABS" 2>&1 \
    | grep -v -i 'shared_memory' || true
  [ -s "$OUT" ] || { echo "error: Chrome produced no screenshot for $IN" >&2; exit 1; }
  echo "ok: $OUT ${W}x${H} (sem crop — confira o rodapé no passo de verificação)"
fi
