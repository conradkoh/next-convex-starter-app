#!/usr/bin/env bash
# Detect whether apps/mobile/package.json version changed on the current commit.
# Writes GitHub Actions outputs: changed (true|false), version (<semver>).
set -euo pipefail

PACKAGE_JSON="apps/mobile/package.json"
OUTPUT="${GITHUB_OUTPUT:-}"

if [ -z "$OUTPUT" ]; then
  echo "GITHUB_OUTPUT is not set" >&2
  exit 1
fi

if [ ! -f "$PACKAGE_JSON" ]; then
  echo "changed=false" >>"$OUTPUT"
  echo "version=" >>"$OUTPUT"
  echo "Mobile package not found; skipping release."
  exit 0
fi

CURRENT=$(node -p "require('./${PACKAGE_JSON}').version")
PREVIOUS=""

if git rev-parse HEAD~1 >/dev/null 2>&1 && git cat-file -e "HEAD~1:${PACKAGE_JSON}" 2>/dev/null; then
  PREVIOUS=$(git show "HEAD~1:${PACKAGE_JSON}" | node -pe "JSON.parse(fs.readFileSync(0,'utf8')).version")
fi

if [ "$CURRENT" != "$PREVIOUS" ]; then
  echo "changed=true" >>"$OUTPUT"
  echo "Mobile version changed: ${PREVIOUS:-<none>} -> ${CURRENT}"
else
  echo "changed=false" >>"$OUTPUT"
  echo "Mobile version unchanged at ${CURRENT}"
fi

echo "version=${CURRENT}" >>"$OUTPUT"
