# Local development anonymous login

In local development the anonymous login option is always available: `/login` renders it and
`auth.loginAnon` succeeds even when `disableLogin` is `true` in
`services/backend/config/featureFlags.ts` or when `allowedSignupMethods` is `null` or
`['invite']`. This keeps developers from being locked out by production-oriented flags that are
shared by every environment.

## The signal: a loopback Convex URL

`process.env.NODE_ENV` is not guaranteed inside Convex functions, so the backend cannot rely on
it. Instead the deployment URL decides:

- backend: `process.env.CONVEX_CLOUD_URL` (e.g. `http://127.0.0.1:3210` locally)
- webapp: `process.env.NEXT_PUBLIC_CONVEX_URL` (the deployment URL the browser uses)

Each runtime reads its own variable, and the two are expected to name the same deployment.
Nothing enforces that. See [Security and self-hosted deployments](#security-and-self-hosted-deployments).

The shared predicate lives in `services/backend/config/localDevelopment.ts`:

- `isLoopbackUrl(url)` — parses the URL and checks its hostname against `localhost`, `127.0.0.1`,
  and `::1`. The URL parser reports IPv6 hosts in brackets, so `http://[::1]:3210` also matches.
  `0.0.0.0` is a wildcard bind address, not a loopback address, so it is not local. Unset, empty,
  or unparseable input is `false`.
- `isLocalDevelopment()` — backend wrapper that reads `CONVEX_CLOUD_URL` on every call.

## Scope

Only anonymous login is affected. Google, code login, invite signup, and recovery keep their
existing gating. When `disableLogin` is `true` locally, `/login` offers anonymous login only.

Locally, the webapp also:

- shows the Login link in the navigation bar even when `disableLogin` is `true`, so `/login` is
  reachable;
- hides the "Sign-ups are currently closed" banner, because anonymous login is offered;
- shows the hint "Local development: anonymous login is always available." When only invite
  signup is allowed, this hint replaces the invite-only hint.

On hosted deployments (non-loopback or missing URL), the gates and the "Login Disabled" card are
unchanged.

## Security and self-hosted deployments

Detection is based on the URL, not on the environment. Any deployment whose backend
`CONVEX_CLOUD_URL` or webapp `NEXT_PUBLIC_CONVEX_URL` has a loopback hostname is treated as local
development, wherever it actually runs.

- A self-hosted Convex backend is commonly configured with the loopback default
  `http://127.0.0.1:3210`. If that deployment is reachable by other users, `auth.loginAnon`
  skips the `disableLogin` and self-signup gates for them.
- The two runtimes can disagree when the URLs differ. With a loopback `CONVEX_CLOUD_URL` and a
  non-loopback `NEXT_PUBLIC_CONVEX_URL`, the browser keeps hosted behavior (no anonymous option
  when `disableLogin` is `true`), but the backend still accepts `loginAnon` calls. With the
  reverse, the browser offers anonymous login locally while the backend rejects the call with
  `FEATURE_DISABLED` or `SIGNUP_DISABLED`.

Operator guidance:

- Do not expose a production or shared deployment on a loopback origin. Set both
  `CONVEX_CLOUD_URL` and `NEXT_PUBLIC_CONVEX_URL` to the public origin users reach.
- Treat any deployment with a loopback URL as local development. Do not rely on `disableLogin`
  or `allowedSignupMethods` to close it.
- Keep the two URLs pointing at the same deployment.
