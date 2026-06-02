# Application

Application-specific (non-framework) backend code.

## Auth (`application/auth/`)

Declarative RBAC: define permissions and roles in code, then guard Convex handlers with `requirePermission`.

- **`permissions.ts`** — permission registry; add keys before using in roles
- **`roles.ts`** — `roleDefinitions`; append roles and their permission grants
- **`resolve.ts`** — `hasPermission`, `getPermissionsForUser` (maps `accessLevel` → roles today)
- **`requirePermission.ts`** — `requirePermission(ctx, userId, permission)` for queries/mutations

See [RBAC foundation](../../../../docs/application/auth/rbac-foundation.md).
