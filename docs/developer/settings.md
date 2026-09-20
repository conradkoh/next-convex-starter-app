# Settings architecture

Settings modules are the canonical home for user preferences and account-management surfaces. A
module owns its section semantics and presentation while existing low-level components continue to
own their data access and interaction details.

## Module map and URLs

The current compatibility route is `/app/profile`. The target primary settings routes are:

1. User — `/app/settings/user`
2. Appearance — `/app/settings/appearance`
3. Notifications — `/app/settings/notifications`

The primary module listing follows that order. Profile is a settings-owned content module in this
phase, but it is not a primary navigation item. Phase 2 will decide how Profile content is exposed
through the User settings experience without adding duplicate primary navigation.

## Data flow

Convex remains the server source of truth. Use the session-aware hooks according to the operation:

- `useSessionQuery` for reactive authenticated reads.
- `useSessionMutation` for authenticated writes.
- `useSessionAction` for authenticated external or side-effecting actions.

Keep server data redacted and keep secrets out of client state whenever possible. A settings wrapper
should compose the low-level feature that owns its hooks rather than introducing a second fetch or
mutation path.

## Local state and lifecycle

Local `useState` or `useReducer` is for drafts, pending flags, dialogs, transient feedback, and
client-only presentation. Do not broadly mirror query data into local state with `useEffect`; use a
narrow initialization guard when necessary and update state in explicit action-completion paths.

Every module must define the states relevant to its behavior: loading, empty or unconfigured, error,
pending, success, and destructive confirmation when applicable. Pending controls should remain
usable and stable, while success and error feedback should be safe for display.

## URL and history conventions

Use one route per primary module under `/app/settings/<module>`. Use `Link` for ordinary navigation
and `router.push` after a successful submit when a flow returns to a listing. Keep Back to App and
parent-section links explicit; do not implement a custom history stack.

Preserve `/app/profile` as a compatibility route until Phase 2 completes the migration. Do not
change OAuth return URLs or other callers as part of a module extraction phase.

## Submit/action conventions

Use semantic forms and `onSubmit`: prevent the default browser submission, normalize and validate
input, disable relevant controls while pending, and provide safe toast or inline feedback.

Destructive actions require an `AlertDialog` confirmation and must close or reset their state on
success or failure. Never render raw backend or provider errors when they may contain secrets.

## Keyboard/accessibility conventions

Prefer native buttons, inputs, labels, links, and forms. Enter submits forms, and Escape closes
dropdowns or dialogs through the existing UI primitives. Do not add global shortcuts unless a module
documents a real need.

Keep visible focus states, connect headings and descriptions with `aria-labelledby` and
`aria-describedby`, use `aria-live="polite"` for asynchronous status, and provide accessible names
for icon-only controls.

## Migration rule

Establish a canonical settings module first, migrate every caller to it, and then delete legacy
route or component code. Do not maintain parallel implementations. During an incremental migration,
the compatibility route may compose the canonical modules, but it must not retain a second copy of
their state machines or backend calls.
