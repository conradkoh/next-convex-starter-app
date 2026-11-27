# Error Handling

This is the reference for how failures are raised in the Convex backend and shown in the webapp. The
contract is one payload shape, one throw path, one client parser and one set of boundaries.

```ts
type AppErrorPayload = {
  code: ErrorCode; // registered code
  message: string; // static, user-safe sentence
  details?: ErrorDetails; // flat, non-sensitive context
};
```

The payload is the entire `ConvexError.data`. Nothing else crosses the wire.

## Overview

### Ownership

| Concern                                                        | Owner                                                 |
| -------------------------------------------------------------- | ----------------------------------------------------- |
| Code registry and payload types                                | `packages/shared/src/domain/errors`                   |
| Constructing and throwing                                      | Backend `services/backend/modules/errors/appError.ts` |
| Default user-safe message and domain details                   | Backend                                               |
| Parsing, classifying, copy precedence                          | `apps/webapp/src/lib/errors`                          |
| Titles, layout, recovery actions, reference display, reporting | `apps/webapp/src/modules/errors`                      |

## Error codes

The registry lives in `packages/shared/src/domain/errors/codes.ts`. It exports
`COMMON_ERROR_CODES`, `DOMAIN_ERROR_CODES`, `ERROR_CODES`, `ErrorCode`, `CommonErrorCode`,
`DomainErrorCode`, `isErrorCode` and `isCommonErrorCode`.

### Rules

- `SCREAMING_SNAKE_CASE`, named for the condition, not for an HTTP status or a UI state.
- The code is a wire contract: **additive only**. Never rename or reuse a code.
- To retire a code, migrate every thrower and keep it in the registry marked deprecated for one
  release.
- Add a domain code (`<DOMAIN>_<CONDITION>`) only when the UI must branch on the cause or show
  cause-specific recovery. Otherwise use a common code plus `details.reason` or
  `details.resource`.
- Do not add unused codes. There is no `RATE_LIMITED`, because nothing throws it.

### Common codes

Common codes have default frontend copy in `apps/webapp/src/lib/errors/commonCopy.ts`
(`COMMON_ERROR_COPY`).

| Code                | Tier   | Meaning                                           | Default frontend copy                                                 |
| ------------------- | ------ | ------------------------------------------------- | --------------------------------------------------------------------- |
| `NOT_AUTHENTICATED` | common | Session missing, expired or unlinked              | Your session has expired. Please sign in again.                       |
| `FORBIDDEN`         | common | Authenticated but lacks the permission            | You don't have permission to do this.                                 |
| `NOT_FOUND`         | common | The requested resource does not exist             | We couldn't find what you were looking for.                           |
| `INVALID_INPUT`     | common | Input failed validation                           | Some of the information provided isn't valid. Check it and try again. |
| `CONFLICT`          | common | State changed or is incompatible with the request | This changed since you loaded it. Refresh and try again.              |
| `FEATURE_DISABLED`  | common | Feature is switched off                           | This feature isn't available right now.                               |
| `INTERNAL_ERROR`    | common | Unexpected server-side fault                      | Something went wrong on our side. Please try again.                   |

For a coded error the backend `message` normally wins over `COMMON_ERROR_COPY`; see
[`describeError` precedence](#describeerror-precedence).

### Domain codes

Domain codes exist because the UI branches on them or shows specific recovery.

| Code                    | Meaning                                                |
| ----------------------- | ------------------------------------------------------ |
| `SIGNUP_DISABLED`       | Sign-ups are disabled or require an invite             |
| `EMAIL_ALREADY_EXISTS`  | The email is already registered (accepted legacy leak) |
| `INVITE_INVALID`        | The invite code is unknown or no longer valid          |
| `INVITE_EMAIL_MISMATCH` | The invite belongs to a different email                |
| `GOOGLE_ACCOUNT_IN_USE` | The Google account is linked to another user           |
| `ALREADY_CONNECTED`     | A Google account is already connected                  |
| `NO_GOOGLE_ACCOUNT`     | No Google account is connected                         |
| `UNSAFE_DISCONNECT`     | Disconnecting would lock the user out                  |
| `OAUTH_ERROR`           | The OAuth exchange or profile fetch failed             |
| `USER_TYPE_MISMATCH`    | The action is not available for this user type         |
| `INVALID_USER_TYPE`     | The requested user type is not valid                   |
| `INVALID_CONVERSION`    | The requested user-type conversion is not allowed      |

### Legacy to canonical mapping

Stage 1 replaced these codes and message-only errors. They no longer exist in the registry.

| Legacy                                     | Canonical                                           |
| ------------------------------------------ | --------------------------------------------------- |
| `UNAUTHORIZED`                             | `NOT_AUTHENTICATED`                                 |
| `VALIDATION_ERROR`, `INVALID_STATE`        | `INVALID_INPUT`                                     |
| `USER_NOT_FOUND`                           | `NOT_FOUND` with `{ resource: 'user' }`             |
| `LOGIN_ERROR`, `CONNECT_ERROR`             | `OAUTH_ERROR` with `{ flow: 'login' \| 'connect' }` |
| plain `"X not found"` `Error`              | `NOT_FOUND` with `{ resource }`                     |
| plain `"inactive"` / `"concluded"` `Error` | `CONFLICT` with `{ resource, reason }`              |

`FORBIDDEN` messages are now static. The permission key moved from the message into
`details.permission`, where it is machine-readable context for backend and ops debugging. No
frontend consumer branches on it today and it is never rendered. A permission key is an internal
capability name, not PII or a secret, so keeping it out of `message` (which users read) is the
point, while keeping it in `details` (which the UI treats as untrusted) is safe and useful.

## Messages and details

### Messages

- One static English sentence, user-safe and actionable.
- Never interpolate user input, ids, emails, tokens, permission keys, table names or stack traces.
- Change existing text only to remove a leak or fix the copy. Do not churn messages.
- The same message serves every client of the function; context belongs in `details`.

### Details

`details` is a flat map whose values are `string | number | boolean | null | string[]`.

- Reserved keys: `field`, `fields`, `reason`, `resource`, `limit`, `retryAfterMs`, `flow`,
  `permission`. Domain keys such as `issues` are allowed when they follow the same rules.
- Allowed: field names, reason enums, resource type names, numeric limits, and permission keys as
  machine-readable context for backend/ops debugging (`FORBIDDEN` sets `details.permission`). The
  frontend does not branch on `details.permission` today; do not start relying on it without a
  product need.
- Forbidden: PII (email, name), secrets, authorisation codes, session ids, other users' document
  ids, and any internal diagnostics.
- The frontend treats `details` as optional and untrusted for display.
- Anti-enumeration: do not add a new code that reveals whether an account exists.
  `EMAIL_ALREADY_EXISTS` is accepted legacy.

`ConvexError.data` is public to the client **even in production**. It is not a log sink.

## Backend

### Decision tree

| Situation                                  | Throw                                           |
| ------------------------------------------ | ----------------------------------------------- |
| Expected failure the user can recover from | `throw appError(code, message, details?)`       |
| Invariant or unexpected fault              | `throw new Error('invariant: …')`               |
| Anything else                              | Nothing: never construct `ConvexError` directly |

A plain `Error` reaches the client as a generic `Server Error` with a Convex Request ID. The
frontend classifies it as unknown and shows fallback copy. Use it for bugs, not for validation.

```ts
import { appError } from '../../modules/errors/appError';

if (!checklist) {
  throw appError('NOT_FOUND', 'Checklist not found', { resource: 'checklist' });
}
```

`appError` is the only sanctioned constructor. It throws a `TypeError` at author time when the
message is empty or `details` is not a valid flat map.

### Lint enforcement

`local/no-raw-convex-error` (from `eslint-rules/no-raw-convex-error.mjs`) reports
`new ConvexError(...)` in `services/backend/**/*.ts`. Exempt: `services/backend/modules/errors/**`,
`**/*.spec.ts`, `**/*.test.ts`, `**/_generated/**`. Do not disable it; use `appError` or plain
`Error`.

### Convex serialization limits

`ConvexError.data` must be a Convex `Value`:

- No `undefined` — omit the key instead. Convex rejects it.
- No `Date`, `Map`, `Set`, class instances or functions.
- Object keys must be non-empty, at most 1024 characters, and must not start with `$`.
- Keep the payload well under about 1 KB. Convex caps total size and nesting (8192 array items,
  16 levels, 1 MiB).

### Testing the backend

Assert the payload at the public function boundary with convex-test:

```ts
const error = await captureError(() =>
  t.mutation(api.checklists.addChecklistItem, { checklistKey: 'missing', text: 'x', sessionId })
);

expect(error.data).toMatchObject({
  code: 'NOT_FOUND',
  message: 'Checklist not found',
  details: { resource: 'checklist' },
});
```

`services/backend/convex/errors.contract.spec.ts` is the reference. It also checks that the
payload is JSON-serialisable and contains no `undefined`. Spec files may still use `ConvexError`
when constructing fake data for client tests.

## Frontend

### Two failure paths

| Failure                                   | Handling                                                                          |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| Query throws during render                | Caught by the nearest `ErrorBoundary` / `error.tsx`                               |
| Mutation, action, event handler rejection | **Not** caught by boundaries — catch it and show inline copy with `describeError` |

```tsx
try {
  await mutate(args);
} catch (e) {
  setError(
    describeError(e, {
      fallback: "We couldn't save the invite. Please try again.",
    }).message
  );
}
```

Render inline action failures as `<p role="alert" className="text-sm text-destructive">` beside
the control. Clear them when the user retries. Do not show a panel for a leaf action failure.

### `describeError` precedence

`describeError(error, { fallback, overrides? })` returns `{ message, code, referenceId }`:

1. `overrides[code]` — call-site context.
2. Common copy for `INTERNAL_ERROR` and `NOT_AUTHENTICATED` — the backend message is ignored.
3. The backend payload `message`, for every other coded error.
4. `COMMON_ERROR_COPY[code]`.
5. `fallback`.

Unknown errors get `fallback` plus `referenceId`. `Error.message` is never used as copy.

### Never display `error.message`

- For a `ConvexError`, `error.message` is the stringified JSON prefixed with
  `[CONVEX …] [Request ID …]`.
- For a server error, it is the literal text `Server Error`.

Use `error.data` through `describeError`, and show the extracted reference separately.

### Branch on `code`, never on message text

`toClientError` returns `code: ErrorCode | null` and `rawCode` (kept for logging). A code that is
not in this build's registry stays `null`; the backend message is still shown. `ErrorCode` makes
unknown codes a compile error on the backend.

### Auth expiry

- `NOT_AUTHENTICATED` → `RouteError` renders `SessionExpiredRedirect`, which calls
  `router.replace('/login')`.
- `FORBIDDEN` stays inline: no redirect, no retry, home action only.
- `auth.getState` returning `state: 'unauthenticated'` is normal data, not an error. `RequireLogin`
  decides what to render from it.

### Escalating an async error to a boundary

Boundaries cannot catch a rejected promise. To deliberately escalate, rethrow from a state
updater, which makes React treat it as a render error:

```tsx
setState(() => {
  throw err;
});
```

Use this sparingly; prefer inline copy for action failures.

### Reporting

`reportError({ error, scope, componentStack?, digest? })` defaults to
`console.error('[app-error]', scope, error, { digest, componentStack })`. Forks can plug in a
vendor adapter with `setErrorReporter(reporter)`, which returns a restore function. This repo has
no vendor dependency. `ErrorBoundary.componentDidCatch` and `RouteError`'s effect call the
reporter; a broken reporter never breaks the error UI.

## Boundary map

App Router order is `layout > error boundary > page`, so a segment `error.tsx` sits inside its
layout and keeps the layout mounted.

| Level                 | File / placement                                                          | Catches                                        | Fallback                                                           |
| --------------------- | ------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------ |
| Root crash            | `apps/webapp/src/app/global-error.tsx`                                    | Root-layout and root server render failures    | `AppUnavailable`, own `<html>`/`<body>`, reload                    |
| Provider tier         | `ErrorBoundary scope="app-providers"` in `apps/webapp/src/app/layout.tsx` | Provider, auth-provider or app-info failures   | `AppUnavailable` (element fallback)                                |
| Shell: navigation     | `ErrorBoundary scope="navigation"` around `<Navigation/>`                 | Navigation render failures                     | `NavigationFallback` (minimal header)                              |
| Shell: install banner | `ErrorBoundary scope="install-banner"` around `InstallAppMobileBanner`    | Install banner render failures                 | `null` (silent)                                                    |
| Root route            | `apps/webapp/src/app/error.tsx`                                           | Any page/segment failure under the root layout | `RouteError scope="route:root"`                                    |
| Admin segment         | `apps/webapp/src/app/app/admin/error.tsx`                                 | Admin child page failures                      | `RouteError scope="route:admin"`, home `/app` "Back to app"        |
| System-admin segment  | `apps/webapp/src/app/app/system-admin/error.tsx`                          | System-admin child page failures               | `RouteError scope="route:system-admin"`, home `/app` "Back to app" |
| Not found             | `apps/webapp/src/app/not-found.tsx` (server component)                    | `notFound()` and unmatched routes              | Neutral `ErrorPanel`, home link                                    |

### Deliberately no boundary

- `app/app/` itself: the root `error.tsx` is enough; the layout has no chrome beyond `RequireLogin`.
- `/login`, `/developer`, `/test`: they inherit the root boundary.
- `loading.tsx`: it is a skeleton, not a failure surface.
- `app/api/**`: route handlers return HTTP responses.
- Forms and leaf components: their event-handler errors are not catchable; use inline `describeError`.
- `ConvexClientProvider`'s module-scope env throw: `NEXT_PUBLIC_CONVEX_URL` is inlined at build
  time, so a missing value fails the build. That is the intended fail-fast.

### What boundaries catch

Caught: errors during render, in lifecycle methods and in effects, including a `useSessionQuery`
throw. Not caught: event handlers, `setTimeout`, promise or async rejections, SSR errors (Next
turns them into a `digest`), errors thrown by the fallback itself, and hydration mismatches.

### `reset()` semantics

- `reset()` remounts the boundary's children and re-subscribes Convex queries.
- `RouteError`'s "Try again" runs only on user click. When `error.digest` is set, it first runs
  `router.refresh()` inside `startTransition`, then `reset()`.
- Retry appears only for unknown errors, `INTERNAL_ERROR` and `CONFLICT`; `FORBIDDEN` and
  `NOT_FOUND` offer only the home action.

### Adding a region boundary

Wrap only a self-contained widget whose failure should not take down the page. Use a client module
when passing a render function; a server component can only pass an element fallback.

```tsx
<ErrorBoundary
  scope="widget:markdown-editor"
  fallback={({ error, reset }) => {
    const described = describeError(error, {
      fallback: 'Something went wrong while loading this section.',
    });
    return (
      <ErrorPanel
        variant="region"
        title="This section couldn't load"
        message={described.message}
        referenceId={described.referenceId}
        actions={<Button onClick={reset}>Try again</Button>}
      />
    );
  }}
>
  <MarkdownEditor />
</ErrorBoundary>
```

Element fallbacks can read the caught error and `reset` with `useErrorBoundaryState()`.

## UI copy and states

`ErrorPanel` renders every surface: region, page or screen variant, error or neutral tone. Titles
are sentence case; bodies say what failed and what to do next.

| Code                  | Route title                    | Body fallback (when the backend sends none)                           | Actions               |
| --------------------- | ------------------------------ | --------------------------------------------------------------------- | --------------------- |
| unknown error         | Something went wrong           | We couldn't load this page. Try again in a moment.                    | Try again, Go to home |
| `INTERNAL_ERROR`      | Something went wrong           | Something went wrong on our side. Please try again.                   | Try again, Go to home |
| `NOT_AUTHENTICATED`   | no panel                       | Your session has expired. Redirecting to sign in…                     | `Sign in now`         |
| `FORBIDDEN`           | You don't have access          | You don't have permission to do this.                                 | Go to home            |
| `NOT_FOUND`           | We couldn't find that          | We couldn't find what you were looking for.                           | Go to home            |
| `INVALID_INPUT`       | Something doesn't look right   | Some of the information provided isn't valid. Check it and try again. | Go to home            |
| `CONFLICT`            | This page is out of date       | This changed since you loaded it. Refresh and try again.              | Try again, Go to home |
| `FEATURE_DISABLED`    | This isn't available right now | This feature isn't available right now.                               | Go to home            |
| any other domain code | Something went wrong           | the backend message                                                   | Go to home            |

Other surfaces:

- **Region**: title `This section couldn't load`; fallback body `Something went wrong while loading
this section.`; action `Try again`.
- **App unavailable** (provider tier and global): title `The app isn't available right now`; body
  `Reload the page to try again. If it keeps happening, try again in a few minutes.`; action
  `Reload page`, pending label `Reloading…`.
- **Navigation fallback**: `Home`, `The menu couldn't load.`, `Reload`, pending `Reloading…`.
- **Not found**: title `Page not found`; body `The page you're looking for doesn't exist or may
have moved.`; action `Go to home`.
- **Session redirect**: `Your session has expired. Redirecting to sign in…` and `Sign in now`.
- **Reference line**: `Reference: <id>`, nothing else.
- **Dev detail label**: `Technical details (development only)`, rendered only when
  `NODE_ENV !== 'production'`.

Copy style for overrides and inline messages:

- Sentence case, one or two sentences, full stop.
- Say what could not be done, then what the user can do next:
  `We couldn't save the invite. Check the email address and try again.`
- Never include ids, codes, permission keys, stack text or `Error.message`.
- No "Oops", "Sorry", "Unfortunately", "failed", "invalid user" or "you entered…". Use "couldn't"
  and "isn't".
- No toasts, snackbars or popups. See
  [theme.md](../application/design/theme.md#feedback--notifications).

Focus rules: `page` and `screen` panels focus the heading on mount; `region` panels do not, to
avoid scroll jumps. A retry that fails remounts the panel, so the alert is announced again.

## Testing

| Layer            | Where                                                                                                             |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| Shared contract  | `packages/shared/src/domain/errors/codes.test.ts`, `payload.test.ts` (vitest)                                     |
| Backend contract | `services/backend/convex/errors.contract.spec.ts` (convex-test through `t.mutation` / `t.query`)                  |
| Client parsing   | `apps/webapp/src/lib/errors/clientError.test.ts`, `report.test.ts`                                                |
| Boundaries (RTL) | `apps/webapp/src/modules/errors/{ErrorBoundary,ErrorPanel,RouteError,AppUnavailable,NavigationFallback}.test.tsx` |
| Browser          | `apps/webapp/tests/e2e/specs/upstream/error-boundaries.spec.ts` via `/test/errors` modes                          |

RTL rules:

- Mock only the external boundary: `next/navigation`. Substitute the reporter with
  `setErrorReporter`; it returns a restore function.
- Use `vi.stubEnv('NODE_ENV', 'production')` when asserting that dev detail is hidden.

Playwright scenarios on the dev-only `/test/errors` page: `?mode=render|auth|forbidden|region|screen`.
`sessionStorage['test-errors:recover'] = '1'` makes a throwing scenario recover on retry.

## Not yet migrated (stage 2)

The remaining ad-hoc catch sites, OAuth callback string mapping and widget region boundaries are
tracked in the memory decision log:
[error-handling-migration.md](../../memory/architecture/error-handling-migration.md).
