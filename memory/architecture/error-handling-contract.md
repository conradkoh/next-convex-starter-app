---
type: decision-log
title: Error-handling contract and boundary architecture
description: Why errors use a shared {code,message,details} registry, a single appError() throw path, describeError() on the client, and a layered set of Next.js boundaries.
tags: [errors, convex, boundaries]
status: stable
---

# Error-handling contract and boundary architecture

## Context

Before this decision the app had no `error.tsx`, `global-error.tsx` or `not-found.tsx` boundaries.
`AuthErrorBoundary` decided whether an error was an auth error by substring-matching
`User not authenticated` / `Session not found` / `not authenticated` against the error message. Real
Convex errors are prefixed with `[CONVEX …]` and carry the payload in `error.data`, so those
substring checks never matched. Backend functions threw ad-hoc `{ code, message }` payloads with
duplicate and inconsistent codes (`UNAUTHORIZED`, `VALIDATION_ERROR`, `INVALID_STATE`,
`USER_NOT_FOUND`). `FORBIDDEN` messages leaked a permission key to the user. Several frontend sites
rendered raw `Error.message`, which for a Convex error is stringified JSON.

## Decisions

- **Shared registry is the SSOT.** Codes and payload types live in `packages/shared/src/domain/errors`
  because the package is isomorphic (no `convex`, no React) and both workspaces already depend on it.
- **One throw path.** Backend code throws expected failures through
  `services/backend/modules/errors/appError.ts`; a custom ESLint rule (`local/no-raw-convex-error`)
  bans `new ConvexError` elsewhere. Rationale: one place validates the message and `details`, and
  the contract cannot drift per module.
- **Legacy codes are mapped, not re-used.** `UNAUTHORIZED` → `NOT_AUTHENTICATED`; `VALIDATION_ERROR`
  and `INVALID_STATE` → `INVALID_INPUT`; `USER_NOT_FOUND` → `NOT_FOUND` with
  `{ resource: 'user' }`; `LOGIN_ERROR` / `CONNECT_ERROR` → `OAUTH_ERROR` with a `flow` detail.
  Rationale: clients branch on the condition, not on historical names.
- **Static messages, flat non-sensitive details.** `ConvexError.data` is public to the client even
  in production, so PII, secrets, session ids, other users' document ids and diagnostics stay out.
  The `FORBIDDEN` permission key moved from the message into `details.permission`, where it is
  machine-readable backend/ops context with no frontend consumer today.
- **No `correlationId` field.** Convex already returns a Request ID inside the client error message;
  the client extracts it best-effort and shows `Reference: <id>`. Convex handlers have no
  request-id API, so a payload field would need invented ids.
- **Auth semantics.** `NOT_AUTHENTICATED` redirects to `/login`; `FORBIDDEN` is shown inline and
  never redirects; `UNAUTHORIZED` is retired. `auth.getState` returning `unauthenticated` remains
  normal data, not an error.
- **Plain `Error` only for invariants.** Unexpected faults reach the client as a generic
  `Server Error`; expected, user-recoverable failures use `appError`.
- **`AuthErrorBoundary` is deleted.** App Router boundaries sit inside `app/app/layout.tsx`, so the
  segment `error.tsx` catches auth errors before a boundary placed in the layout would. Auth handling
  moved into `RouteError`, which renders `SessionExpiredRedirect`.
- **Layered boundaries.** `global-error.tsx` for root crashes, provider/navigation/banner
  `ErrorBoundary`s in the root layout, segment `error.tsx` files for routes, and one server
  `not-found.tsx`. The map is in the reference doc.
- **No toasts.** Error feedback is inline or in a panel, per the theme conventions.
- **`useErrorBoundaryState()` exists because server layouts can only pass element fallbacks.**
  The context gives those elements the caught error and `reset` without turning the layout into a
  client component.

## Consequences

- Call sites have two functions to learn: `appError` on the backend and `describeError` on the
  client. There is no wrapper hook or provider to adopt.
- Every new code is a small two-file change: the registry plus the documentation table.
- The lint rule makes the raw-constructor path fail in CI; specs and `modules/errors/**` stay
  exempt.
- Some ad-hoc catch sites, OAuth callback errors and heavy widgets are still on the old path; they
  are tracked in [the stage-2 migration log](/architecture/error-handling-migration.md).

## References

- [Error-handling conventions](../../docs/developer/error-handling.md)
- [Next.js conventions](../../docs/developer/nextjs-conventions.md)
- Code: `packages/shared/src/domain/errors/`, `services/backend/modules/errors/`,
  `apps/webapp/src/lib/errors/`, `apps/webapp/src/modules/errors/`
