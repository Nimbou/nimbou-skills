#!/usr/bin/env bash
# html_to_pdf.sh — render a styled HTML approval document to PDF.
#
# Usage: html_to_pdf.sh <input.html> <output.pdf>
#
# Prefers a headless Chromium (best CSS fidelity); falls back to WeasyPrint,
# then LibreOffice, then Pandoc. Validates the result with pdfinfo when present.
# The benign headless-Chrome "ERROR ... shared_memory" line is filtered out.
set -euo pipefail

IN="${1:?usage: html_to_pdf.sh <input.html> <output.pdf>}"
OUT="${2:?usage: html_to_pdf.sh <input.html> <output.pdf>}"

[ -f "$IN" ] || { echo "error: input HTML not found: $IN" >&2; exit 1; }
mkdir -p "$(dirname "$OUT")"

# Chrome needs an absolute file:// URL.
abspath() { case "$1" in /*) printf '%s' "$1";; *) printf '%s/%s' "$PWD" "$1";; esac; }
IN_ABS="$(abspath "$IN")"

find_bin() { for b in "$@"; do command -v "$b" >/dev/null 2>&1 && { printf '%s' "$b"; return 0; }; done; return 1; }

if CHROME="$(find_bin google-chrome google-chrome-stable chromium chromium-browser chrome)"; then
  converter="chrome"
elif find_bin weasyprint >/dev/null; then
  converter="weasyprint"
elif find_bin libreoffice soffice >/dev/null; then
  converter="libreoffice"
elif find_bin pandoc >/dev/null; then
  converter="pandoc"
else
  echo "error: no HTML->PDF converter found (need chrome/chromium, weasyprint, libreoffice, or pandoc)" >&2
  exit 1
fi

echo "converter: $converter"
case "$converter" in
  chrome)
    "$CHROME" --headless=new --disable-gpu --no-sandbox \
      --no-pdf-header-footer --print-to-pdf="$OUT" "file://$IN_ABS" 2>&1 \
      | grep -v -i 'shared_memory' || true
    ;;
  weasyprint)
    weasyprint "$IN_ABS" "$OUT"
    ;;
  libreoffice)
    LO="$(find_bin libreoffice soffice)"
    "$LO" --headless --convert-to pdf --outdir "$(dirname "$OUT")" "$IN_ABS" >/dev/null
    gen="$(dirname "$OUT")/$(basename "${IN%.*}").pdf"
    [ "$gen" = "$OUT" ] || mv -f "$gen" "$OUT"
    ;;
  pandoc)
    pandoc "$IN_ABS" -o "$OUT"
    ;;
esac

[ -s "$OUT" ] || { echo "error: output PDF was not produced: $OUT" >&2; exit 1; }

if command -v pdfinfo >/dev/null 2>&1; then
  echo "--- pdfinfo ---"
  pdfinfo "$OUT" | grep -E '^(Pages|Page size|File size|Producer):' || pdfinfo "$OUT"
else
  echo "pdfinfo not available; wrote $OUT ($(wc -c < "$OUT") bytes)"
fi
echo "ok: $OUT"
