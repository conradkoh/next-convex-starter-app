---
name: error-handling
description: Use when adding or changing error handling in this repo — throwing errors from Convex functions, showing errors in the UI, choosing or adding error codes, adding error.tsx or ErrorBoundary components, handling auth/session expiry, writing error tests, or reviewing code that throws or catches errors. Covers the {code,message,details} contract, appError(), describeError(), and boundary placement.
---

# Error handling

Full reference: [docs/developer/error-handling.md](../../../docs/developer/error-handling.md). Read it
before changing the contract; this skill is the checklist.

## Backend decision tree

- Expected, user-recoverable failure → `throw appError(code, message, details?)` from
  `services/backend/modules/errors/appError.ts`.
- Invariant or unexpected fault → `throw new Error(...)`. The client sees generic "Server Error".
- Never `new ConvexError(...)` in product code. `local/no-raw-convex-error` fails the build.

## Choosing a code

- Pick a common code first: `NOT_AUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `INVALID_INPUT`,
  `CONFLICT`, `FEATURE_DISABLED`, `INTERNAL_ERROR`.
- Add a domain code only when the UI must branch on the cause. Registry:
  `packages/shared/src/domain/errors/codes.ts`; add the row to the doc's code table.
- Codes are additive only. Never rename or reuse one; deprecate for a release instead.
- Branch on `code`, never on message text.

## Message and details

- Message: one static, user-safe sentence. Never interpolate user input, ids, emails, tokens,
  permission keys, table names or stacks.
- `details`: flat `string | number | boolean | null | string[]`. Reserved keys: `field`, `fields`,
  `reason`, `resource`, `limit`, `retryAfterMs`, `flow`, `permission`.
- Never put PII, secrets, codes, session ids, other users' document ids or diagnostics in details.
- `ConvexError.data` is public to the client even in production.
- No `undefined` values, `Date`, `Map`, `Set`, class instances or functions. Keep payloads under
  about 1 KB.

## Frontend

- Render-time query failure → nearest boundary.
- Event handler, mutation or action rejection → not caught by boundaries. Catch it and render
  `<p role="alert" className="text-sm text-destructive">` with `describeError`.
- `describeError(e, { fallback })` from `@/lib/errors`. The fallback follows the copy style: sentence
  case, what failed + what to do, no ids/codes/stack, no "sorry"/"failed".
- Never render `error.message`. For a `ConvexError` it is stringified JSON; for a server error it is
  "Server Error".
- `NOT_AUTHENTICATED` → `RouteError` redirects via `SessionExpiredRedirect`. `FORBIDDEN` stays
  inline, no redirect. `auth.getState` unauthenticated is data, not an error.
- No toasts. See `docs/application/design/theme.md`.

## Boundaries

- `app/global-error.tsx` — root crash; own html/body; `AppUnavailable`.
- root layout `app-providers` → `AppUnavailable`; `navigation` → `NavigationFallback`;
  `install-banner` → `null`.
- `app/error.tsx` → `RouteError` scope `route:root`.
- `app/app/admin/error.tsx` and `app/app/system-admin/error.tsx` keep their layouts.
- `app/not-found.tsx` — server component, neutral panel.
- No boundary for `/login`, `/developer`, `/test`, `app/api/**`, forms or leaf components.
- New boundary: only around a self-contained widget whose failure should not take the page. Client
  file for render-function fallbacks; element fallback from a server layout.
- `useErrorBoundaryState()` gives element fallbacks the caught error and `reset`.
- `error.tsx` is a client component that delegates to `RouteError`; `reset()` is user-initiated and
  runs after `router.refresh()` when `digest` is set.

## Tests to add

- Backend: convex-test through `t.mutation`/`t.query`, then
  `rejects.toMatchObject({ data: { code, message, details } })`. Reference:
  `services/backend/convex/errors.contract.spec.ts`.
- Client: vitest for `apps/webapp/src/lib/errors` (parsing, precedence, reference id).
- Boundaries: RTL, mock only `next/navigation`, substitute the reporter with `setErrorReporter`.
  Use `vi.stubEnv('NODE_ENV', 'production')` to assert dev detail is hidden.
- Browser: Playwright `error-boundaries.spec.ts` via `/test/errors?mode=…`.

## Review heuristics

- `throw new Error` for a user-recoverable condition is a defect.
- Any UI that renders `error.message` is a defect.
- Matching on message strings is a defect.
- `undefined` inside `details` is a defect.
- A `new ConvexError` outside `modules/errors` and specs is a defect.

## Pre-merge checklist

- [ ] Codes come from the registry; no renames or reuse.
- [ ] Messages are static and user-safe; details are flat and non-sensitive.
- [ ] Contract spec covers the new payload.
- [ ] UI uses `describeError`; no `error.message`; no toast.
- [ ] Boundary placement follows the map.
- [ ] `pnpm lint` (including `local/no-raw-convex-error`) and the relevant tests pass.
