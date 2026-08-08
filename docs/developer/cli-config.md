# CLI Configuration

The publishable CLI (`pnpm cli`, or the global `next-convex-starter-app` binary)
uses **hardcoded environment URLs** in the SDK source and stores session
credentials in a per-user `auth.jsonc` file. There is **no silent fallback** to
`apps/webapp/.env.local` or `localhost` — the CLI fails fast with setup guidance
when URLs are still placeholders.

## Why

After deploying the Convex backend and the webapp (e.g. to Vercel), fork owners
edit the URL constants in source. **Production is the default environment**;
the `development` constants are opt-in via `--dev`.

## Environment URLs (source code)

**Single source of truth:** [`packages/sdk/src/config/urls.ts`](../../packages/sdk/src/config/urls.ts)

```typescript
export const PRODUCTION_URLS = {
  convexUrl: 'https://YOUR_DEPLOYMENT.convex.cloud',
  webappUrl: 'https://YOUR_APP.vercel.app',
};

export const DEVELOPMENT_URLS = {
  convexUrl: 'https://YOUR_DEV_DEPLOYMENT.convex.cloud',
  webappUrl: 'http://localhost:3000',
};
```

After your first deploy, replace the placeholder values in this file with your
real Convex deployment URL and webapp URL.

### Template repo exception

When the CLI runs from a checkout whose `git remote origin` contains
`next-convex-starter-app`, placeholder URLs are allowed. This lets the template
repo's own development and CI work without editing URLs. Forks must update
`urls.ts` after deploy.

## Session credentials

After a successful `auth login`, the CLI saves credentials to:

`~/.{packageName}/auth.jsonc`

The package name is read from the root `package.json` at runtime (e.g.
`~/.next-convex-starter-app/auth.jsonc` for this template). The file is written
with mode `0600`.

Shape:

```json
{
  "convexUrl": "https://your-deployment.convex.cloud",
  "webappUrl": "https://your-app.vercel.app",
  "sessionId": "..."
}
```

`auth.jsonc` stores the session from login only — not environment URL config.

## Commands

| Command                     | Environment   |
| --------------------------- | ------------- |
| `pnpm cli auth login`       | `production`  |
| `pnpm cli auth login --dev` | `development` |

## Agent / human workflow

1. Run `pnpm cli auth login`.
2. If URLs are still placeholders (and not in the template repo), the CLI exits
   `1` and prints a `CliConfigNotSetUpError` with:
   - the path `packages/sdk/src/config/urls.ts` to edit
   - the constant shape (`PRODUCTION_URLS` or `DEVELOPMENT_URLS`)
   - **Ask the user for:** `convexUrl` and `webappUrl` from their deploy
3. Edit `urls.ts`, commit the change, and re-run.

## Notes

- Production is the default; there is no localhost default anywhere in URL resolution.
- Re-login after changing URLs if your saved `auth.jsonc` session points at old endpoints.
