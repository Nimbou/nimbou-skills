#!/usr/bin/env sh
set -eu

TARGET_DIR="${1:-$PWD}"
ADD_SCRIPTS="${ADD_SCRIPTS:-1}"

if [ ! -f "$TARGET_DIR/package.json" ]; then
  echo "package.json not found in $TARGET_DIR" >&2
  exit 1
fi

PACKAGE_MANAGER="npm"
INSTALL_ARGS="install -D"

if [ -f "$TARGET_DIR/pnpm-lock.yaml" ] || grep -q '"packageManager": *"pnpm@' "$TARGET_DIR/package.json" 2>/dev/null; then
  PACKAGE_MANAGER="pnpm"
  INSTALL_ARGS="add -D"
elif [ -f "$TARGET_DIR/yarn.lock" ] || grep -q '"packageManager": *"yarn@' "$TARGET_DIR/package.json" 2>/dev/null; then
  PACKAGE_MANAGER="yarn"
  INSTALL_ARGS="add -D"
fi

echo "Installing local catalog dependencies into $TARGET_DIR using $PACKAGE_MANAGER..."

cd "$TARGET_DIR"
$PACKAGE_MANAGER $INSTALL_ARGS tsx @vue/compiler-sfc fast-glob typescript vue-component-meta

if [ "$ADD_SCRIPTS" = "1" ]; then
  node <<'NODE'
const fs = require('node:fs')
const path = require('node:path')

const packagePath = path.resolve(process.cwd(), 'package.json')
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
pkg.scripts ||= {}
pkg.scripts.catalog ||= 'tsx .agents/skills/nuxt-catalog/scripts/generate-catalog.ts'
pkg.scripts['nb-catalog:validate'] ||= 'tsx .agents/skills/nuxt-catalog/scripts/generate-catalog.ts --validate'
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`)
NODE
  echo "Added package scripts: catalog, nb-catalog:validate"
else
  echo "Skipped package.json script injection because ADD_SCRIPTS=$ADD_SCRIPTS"
fi

echo "Bootstrap complete."
