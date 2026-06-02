# Application

Application-specific (non-framework) frontend code.

## Auth (`application/auth/`)

Mirrors backend permission/role definitions (keep `permissions.ts` and `roles.ts` in sync).

- **`useHasPermission(permission)`** — hook for conditional UI
- **`<RequirePermission permission="...">`** — render children only when allowed

See [RBAC foundation](../../../../docs/application/auth/rbac-foundation.md).
