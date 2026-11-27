---
type: tech-debt
title: Error-handling stage-2 migration
description: Remaining work to move ad-hoc catch sites, OAuth callback errors, widget boundaries and error tooling onto the shared error contract.
tags: [errors, migration]
status: stable
---

# Error-handling stage-2 migration

Stage 1 established the contract, the single backend throw path, the client parser and the boundary
map. These items still bypass part of it. Each is independently shippable.

## Ad-hoc catch sites

These components and pages catch an error and keep a generic string (or read `error.message`)
instead of using `describeError`.

| Site                                                                     | Remediation                                                      |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `apps/webapp/src/modules/auth/LoginWithCode.tsx`                         | Replace the local message with `describeError(e, { fallback })`. |
| `apps/webapp/src/app/recover/page.tsx`                                   | Same; keep the fallback specific to recovery.                    |
| `apps/webapp/src/app/app/profile/page.tsx`                               | Same for profile actions.                                        |
| `apps/webapp/src/modules/profile/NameEditForm.tsx`                       | Inline `role="alert"` with `describeError`.                      |
| `apps/webapp/src/modules/auth/AnonymousLoginButton.tsx`                  | Inline `role="alert"` with `describeError`.                      |
| `apps/webapp/src/modules/auth/LoginCodeGenerator.tsx`                    | Inline `role="alert"` with `describeError`.                      |
| Attendance dialogs under `apps/webapp/src/modules/attendance/`           | Inline `role="alert"` with `describeError`.                      |
| `apps/webapp/src/modules/checklist/checklist.tsx` (`use-checklist-sync`) | Report or describe the sync failure instead of a generic string. |

## OAuth callback errors

`services/backend/convex/auth/google.ts` still throws 23 plain `Error`s in the OAuth callback
actions. `apps/webapp/src/modules/auth/google-oauth-errors.ts` maps the resulting text to copy, and
`apps/webapp/src/components/CallbackErrorCard.tsx` renders it.

Remediation:

1. Throw `appError` with a stable code (likely a dedicated `OAUTH_CALLBACK_ERROR` plus a `reason`
   detail) in the callback actions.
2. Pass the `code` through the callback URL instead of a message string.
3. Replace the string map and `CallbackErrorCard` with `describeError` on the received code.

## Widget region boundaries

Heavy, self-contained widgets (the markdown editor is the first candidate) should be wrapped in
`ErrorBoundary` with `variant="region"` fallbacks, so a widget crash does not replace the page. Use
a client module for render-function fallbacks; follow the map in the reference doc.

## Internationalisation seam

`describeError` accepts per-code `overrides`, which is the seam for translating copy. No i18n
framework is wired yet. When one is adopted, resolve overrides from the active locale instead of
call sites.

## Vendor error tracking

`reportError` defaults to `console.error('[app-error]', …)`. The seam is `setErrorReporter`, which
returns a restore function. Wire a vendor adapter in the app bootstrap when one is chosen; no vendor
dependency exists today.

## Copy fixes

- `apps/webapp/src/components/UnauthorizedPage.tsx` mentions "financial data", which does not match
  this product. Replace it with neutral "this area" copy.

## Missing not-found boundary

There is no `global-not-found.tsx`. Add one if a not-found state must render outside the root layout
(for example, when the layout itself cannot load). Until then `app/not-found.tsx` covers the app.

## Retiring deprecated codes

Once all throwers and clients move off a deprecated code, remove it from
`packages/shared/src/domain/errors/codes.ts` and the doc table after the one-release deprecation
window. Do not reuse the name.

## Boundary wiring test coverage

The provider, navigation and install-banner `ErrorBoundary`s in `apps/webapp/src/app/layout.tsx` are
covered only by unit tests that build their own tree (`apps/webapp/src/modules/errors/ErrorBoundary.test.tsx`).
No test mounts the real root layout, so whether a real provider or `Navigation` failure reaches its
fallback is unverified. Add an RTL test that renders the layout's inner tree with a throwing
`Navigation` mock, or an e2e scenario that breaks the navigation tier, when the layout can be
structured for it without turning it into a client component.

## NavigationFallback auth dead end

A `NOT_AUTHENTICATED` thrown inside `<Navigation />` lands in `NavigationFallback`, which offers only
Reload. It is reported, not swallowed, but it is a dead end for an expired session. Let
`NavigationFallback` use `useErrorBoundaryState()` and link to `/login` for the auth case, or accept
the dead end.

## ESLint rule alias and member-expression matching

`eslint-rules/no-raw-convex-error.mjs` matches `new ConvexError(...)` only when the callee is the
`ConvexError` identifier. Aliased imports (`import { ConvexError as CE }`), member expressions
(`new convex.ConvexError(...)`) and `.tsx` files are not flagged. Acceptable for the first pass;
extend the rule to member-expression callees ending in `ConvexError` if tighter enforcement is
needed.

## References

- [Error-handling contract and boundary architecture](/architecture/error-handling-contract.md)
- [Error-handling conventions](../../docs/developer/error-handling.md)

OKF rule 4 asks for `/…` bundle-relative links for targets inside `memory/`. The links above point at
`docs/` outside the bundle, so they stay repo-relative (`../../docs/…`); a `/…` path would not
resolve.
