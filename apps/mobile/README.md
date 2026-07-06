# Mobile App

Capacitor shell around a Next.js static export.

## Configuration

`next.config.ts` is set up for static hosting inside native WebViews:

- `output: 'export'` — emits static HTML to `out/`
- `trailingSlash: true` — file paths work reliably in Capacitor
- `images.unoptimized: true` — required for static export

`capacitor.config.ts` points `webDir` at `out/`.

## Development

```bash
# From repo root
pnpm --filter @workspace/mobile dev

# Or from this directory
pnpm dev
```

## Build and sync to Capacitor

```bash
pnpm --filter @workspace/mobile cap:sync
```

This runs `next build` and copies the exported site into any native projects.

## Add native platforms

Native `ios/` and `android/` folders are not committed by default. Add them when ready:

```bash
cd apps/mobile
pnpm exec cap add ios
pnpm exec cap add android
pnpm cap:sync
```

## Automated releases (GitHub Actions)

When a merge to `master` bumps `apps/mobile/package.json` `version`, the
[Release Mobile workflow](../../.github/workflows/release-mobile.yml) builds and
publishes:

- **iOS** — `.ipa` (signed) or unsigned `.xcarchive.zip` fallback
- **macOS** — `.dmg` via Capacitor Electron

Artifacts are attached to a GitHub Release tagged `mobile-v<version>`.

### Required repository secrets (iOS signing)

| Secret                           | Purpose                                        |
| -------------------------------- | ---------------------------------------------- |
| `BUILD_CERTIFICATE_BASE64`       | Base64-encoded `.p12` distribution certificate |
| `P12_PASSWORD`                   | Certificate password                           |
| `KEYCHAIN_PASSWORD`              | Ephemeral keychain password for CI             |
| `BUILD_PROVISION_PROFILE_BASE64` | Base64-encoded App Store provisioning profile  |
| `APPLE_TEAM_ID`                  | Apple Developer Team ID                        |

Without these secrets, iOS builds still run but publish an unsigned archive zip
instead of an installable IPA. macOS DMG builds do not require Apple signing
secrets (notarization can be added later).

### Manual version bump

```bash
# Edit apps/mobile/package.json version, merge to master
```
