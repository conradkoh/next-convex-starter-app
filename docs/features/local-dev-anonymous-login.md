# Local development anonymous login

In local development the anonymous login option is always available: `/login` renders it and
`auth.loginAnon` succeeds even when `disableLogin` is `true` in
`services/backend/config/featureFlags.ts` or when `allowedSignupMethods` is `null` or
`['invite']`. This keeps developers from being locked out by production-oriented flags that are
shared by every environment.

## The signal: a loopback Convex URL

`process.env.NODE_ENV` is not guaranteed inside Convex functions, so the backend cannot rely on
it and the Next bundle could disagree with the backend. Instead the deployment URL decides:

- backend: `process.env.CONVEX_CLOUD_URL` (e.g. `http://127.0.0.1:3210` locally)
- webapp: `process.env.NEXT_PUBLIC_CONVEX_URL` (the same deployment URL)

Both point at the same deployment, so the two runtimes cannot disagree. The shared predicate
lives in `services/backend/config/localDevelopment.ts`:

- `isLoopbackUrl(url)` — parses the URL and checks its hostname against loopback addresses
  (`localhost`, `127.0.0.1`, `0.0.0.0`, `::1`). Unset or unparseable input is `false`.
- `isLocalDevelopment()` — backend wrapper reading `CONVEX_CLOUD_URL` per call.

## Scope

Only anonymous login is affected. Google, code login, invite signup, and recovery keep their
existing gating, so when `disableLogin` is `true` locally the login page offers anonymous login
only. On hosted deployments (non-loopback or missing URL) both gates and the "Login Disabled"
card behave exactly as before.
