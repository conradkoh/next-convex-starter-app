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
