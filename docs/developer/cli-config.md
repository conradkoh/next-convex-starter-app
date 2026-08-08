# CLI Configuration

The publishable CLI (`pnpm cli`, or the global `next-convex-starter-app` binary)
requires explicit environment URLs before running commands such as `auth login`.
There is **no silent fallback** to `apps/webapp/.env.local` or `localhost` — the
CLI fails fast with setup guidance when it is not configured.

## Why

After deploying the Convex backend and the webapp (e.g. to Vercel), the CLI needs
to know which URLs to talk to. **Production is the default environment**; the
`development` block is opt-in via `--dev`.

## Config file

The CLI looks for config in this order:

1. **Repo-local** — `cli.config.json` at the monorepo root (gitignored)
2. **Global** — `~/.config/{packageName}/config.json` (used by a published binary outside a repo)

A committed template lives at `cli.config.example.json` (with editor validation
via `packages/sdk/cli.config.schema.json`).

### Shape

```json
{
  "production": {
    "convexUrl": "https://YOUR_DEPLOYMENT.convex.cloud",
    "webappUrl": "https://YOUR_APP.vercel.app"
  },
  "development": {
    "convexUrl": "https://YOUR_DEV_DEPLOYMENT.convex.cloud",
    "webappUrl": "http://localhost:3000"
  }
}
```

- `production` — **required**. Used by `auth login` without flags.
- `development` — optional. Used by `auth login --dev`.
- `convexUrl` — the Convex deployment URL (from `npx convex deploy` or the Convex dashboard).
- `webappUrl` — the webapp URL (the Vercel/production app URL; localhost for development).

## Commands

| Command                     | Environment   |
| --------------------------- | ------------- |
| `pnpm cli auth login`       | `production`  |
| `pnpm cli auth login --dev` | `development` |

## Agent / human workflow

1. Run `pnpm cli auth login`.
2. If unconfigured, the CLI exits `1` and prints a `CliConfigNotSetUpError` with:
   - the exact config file path to create/update
   - a pointer to `cli.config.example.json`
   - the JSON shape for the requested environment
   - **Ask the user for:** `convexUrl` (Convex deployment URL) and `webappUrl` (Vercel/production app URL)
3. Copy `cli.config.example.json` to `cli.config.json`, fill in the real URLs, and re-run.

## Notes

- `credentials.json` (the session saved after a successful login) is separate
  from the config file.
- Production is the default; there is no localhost default anywhere in config resolution.
