# End-to-End (E2E) Tests

Playwright-based end-to-end tests for the Next.js + Convex starter app.

## How to Run

```bash
# From repo root (runs webapp e2e via turbo)
pnpm e2e

# Or directly from the webapp package
cd apps/webapp && pnpm e2e
```

## Prerequisites

- `apps/webapp/.env.local` must exist with a valid `NEXT_PUBLIC_CONVEX_URL`
- The Convex dev deployment must be reachable from the dev server
- Playwright browsers installed (`npx playwright install` if needed)

## Folder Structure

```
tests/e2e/
  README.md
  playwright.config.ts
  tsconfig.json
  fixtures/
    auth.fixture.ts        # authenticatedPage fixture (anonymous login)
  support/
    tags.ts                # TAG_UPSTREAM / TAG_DOWNSTREAM / TAG_AUTH / TAG_NAV
    upstream-flows.ts      # registry of upstream-owned routes (regression baseline)
  pages/
    base.page.ts           # shared BasePage (do not modify)
    home.page.ts           # public landing page
    login.page.ts          # /login
    app-dashboard.page.ts  # /app
    profile.page.ts        # /app/profile
  specs/
    upstream/              # template-owned flows (tagged @upstream)
    downstream/            # fork-specific flows (tagged @downstream)
```

## Upstream vs Downstream Ownership

- **Upstream** specs (`specs/upstream/`) cover flows owned by the `next-convex-starter-app` template. They mirror the intent of the git `upstream` remote and the `check-upstream-modifications` script: downstream forks should not modify them unless contributing back.
- **Downstream** specs (`specs/downstream/`) are for fork-specific flows. See `specs/downstream/README.md` for conventions.

## Tagging & Filtering

Specs are tagged with Playwright native tags on `test.describe`:

```typescript
test.describe('Home Page', { tag: [TAG_UPSTREAM, TAG_NAV] }, () => {
  // ...
});
```

Filter with `--grep`:

```bash
cd apps/webapp && pnpm exec playwright test --config=tests/e2e/playwright.config.ts --grep @upstream
cd apps/webapp && pnpm exec playwright test --config=tests/e2e/playwright.config.ts --grep @downstream
```

## `support/upstream-flows.ts` Registry

`UPSTREAM_FLOWS` is the canonical registry of upstream-owned routes. These specs form the **regression baseline for the base UI migration** — they must stay green during UI changes.

## Page Object Pattern

- Extend `BasePage`.
- **Auth-related page objects must wait for specific UI signals (visible headings/buttons), not `networkidle`.** Convex keeps the WebSocket connection active, so `waitForLoad()`/`networkidle` never settles on auth pages. Override `navigate()` accordingly.
- `HomePage.navigate()` keeps `waitForLoad()` — acceptable for the static home page.

## Auth Fixture

`fixtures/auth.fixture.ts` uses `test.extend` to provide `authenticatedPage`, which performs an anonymous login before each test:

```typescript
import { test } from '../../fixtures/auth.fixture';

test('shows dashboard when authenticated', async ({ authenticatedPage }) => {
  // authenticatedPage is already logged in
});
```

## Standing Policy

New UI features/changes should add matching e2e tests in the appropriate folder:

- Template flows → `specs/upstream/` (tagged `@upstream`)
- Fork-specific flows → `specs/downstream/` (tagged `@downstream`)

## Troubleshooting

- **Auth tests fail mysteriously with `reuseExistingServer: true`:** you may have `pnpm dev` running from `apps/webapp` only (Next.js without Convex). Kill it and either let Playwright start the server, or run `pnpm dev` from **repo root**.
- **Cold start:** the turbo dev server may take up to 120s to start both webapp and Convex (the `webServer` timeout is set to 120_000ms).
