# E2E Testing

Playwright end-to-end tests for the Next.js + Convex starter app.

## Location & commands

Suite root: `apps/webapp/tests/e2e/`

```bash
# From repo root
pnpm e2e

# Single spec
cd apps/webapp && pnpm exec playwright test --config=tests/e2e/playwright.config.ts specs/upstream/markdown-editor.spec.ts
```

## Folder conventions

| Path                | Purpose                                   |
| ------------------- | ----------------------------------------- |
| `specs/upstream/`   | Template-owned flows (`@upstream`)        |
| `specs/downstream/` | Fork-specific flows (`@downstream`)       |
| `pages/`            | Page objects — extend `BasePage`          |
| `support/`          | Tags, env helpers, upstream flow registry |

Filter by tag: `--grep @upstream`, `--grep @markdown`, etc.

## Pre-push remote gating

`.husky/pre-push` runs the template e2e suite **only** when the git push **destination URL** is the canonical template repository (`conradkoh/next-convex-starter-app` on `github.com`). The decision is made by `scripts/should-run-e2e.ts` from the destination URL git passes as `$2` — fail-closed for non-template, malformed, or unknown URLs.

Downstream forks pushing to their own remotes are never forced to run template e2e in pre-push. Pushes to non-template destinations skip it. `pnpm e2e` remains available for explicit local and CI runs on any checkout.

## Reusability

This suite is designed to be reusable across downstream projects: upstream specs define the template regression baseline, downstream specs hold fork-specific flows, and destination gating keeps fork pre-push hooks lightweight.

## Full detail

See [apps/webapp/tests/e2e/README.md](../apps/webapp/tests/e2e/README.md) for prerequisites, admin seeding, page-object patterns, and troubleshooting.
