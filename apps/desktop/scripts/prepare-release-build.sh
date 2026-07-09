#!/usr/bin/env bash
# Sync apps/desktop version into Electron before CI builds.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VERSION=$(node -p "require('${ROOT_DIR}/package.json').version")

echo "Preparing desktop build for version ${VERSION}"

ELECTRON_PACKAGE_JSON="${ROOT_DIR}/electron/package.json"
if [ -f "$ELECTRON_PACKAGE_JSON" ]; then
  node <<EOF
const fs = require('fs');
const path = '${ELECTRON_PACKAGE_JSON}';
const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
pkg.version = '${VERSION}';
fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
EOF
  echo "Updated electron/package.json"
fi
