# Desktop App

Capacitor Electron shell around a Next.js static export for macOS.

## Configuration

`next.config.ts` is set up for static hosting inside the desktop WebView:

- `output: 'export'` — emits static HTML to `out/`
- `trailingSlash: true` — file paths work reliably in Electron
- `images.unoptimized: true` — required for static export

`capacitor.config.ts` points `webDir` at `out/`. The Electron scaffold in
`electron/` packages the exported site as a native macOS `.app` / `.dmg`.

## Development

```bash
# From repo root
pnpm --filter @workspace/desktop dev

# Or from this directory
pnpm dev
```

## Build macOS desktop app locally

```bash
pnpm --filter @workspace/desktop build:macos
```

This runs `next build`, syncs web assets to Electron, and produces a `.dmg` in
`electron/dist/`.

## Automated releases (GitHub Actions)

When a merge to `master` bumps `apps/desktop/package.json` `version`, the
[Release Desktop workflow](../../.github/workflows/release-desktop.yml) builds a
macOS `.dmg` and publishes it to a GitHub Release tagged `desktop-v<version>`.

### Manual version bump

```bash
# Edit apps/desktop/package.json version, merge to master
```
