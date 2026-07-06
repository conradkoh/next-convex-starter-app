#!/usr/bin/env bash
# Sync apps/mobile version into native targets before CI builds.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VERSION=$(node -p "require('${ROOT_DIR}/package.json').version")

echo "Preparing native builds for version ${VERSION}"

if [ -f "${ROOT_DIR}/ios/App/App/Info.plist" ]; then
  /usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString ${VERSION}" "${ROOT_DIR}/ios/App/App/Info.plist"
  /usr/libexec/PlistBuddy -c "Set :CFBundleVersion ${VERSION}" "${ROOT_DIR}/ios/App/App/Info.plist"
  echo "Updated iOS Info.plist"
fi

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
