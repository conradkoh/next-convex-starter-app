# Application

Application-specific (non-framework) backend code.

## Auth (`application/auth/`)

Declarative RBAC — permissions and roles in code, guards in Convex. `accessLevel` on users remains for role mapping; use `permissions` on `AuthState` and `requirePermission` for authorization.

| File                   | Purpose                                               |
| ---------------------- | ----------------------------------------------------- |
| `permissions.ts`       | Registry — add keys here first                        |
| `roles.ts`             | `roleDefinitions` and grants                          |
| `resolve.ts`           | `hasPermission`, `getResolvedPermissionsForUser`      |
| `requirePermission.ts` | `requirePermission`, `requireAuthenticatedPermission` |

`auth.getState` exposes `permissions: Permission[]` for the webapp.

### Add a permission

1. Register in **both** `permissions.ts` files (backend + `apps/webapp/src/application/auth/permissions.ts`).
2. Grant in **both** `roles.ts` files. `system_admin` uses `systemAdminPermissions` (auto-includes all registry keys).
3. Guard handlers: `requireAuthenticatedPermission(user, 'your:permission')` or `await requirePermission(ctx, userId, '…')`.

See `convex/system/auth/google.ts` for a reference.

### Add a role

Append to `roleDefinitions` in both `roles.ts` files. **Assignment today:** only `accessLevel` → `user` \| `system_admin` in `getRolesForUser`. Do not enable placeholder roles until Phase 1b (`users.roleNames`).

### Naming

Use `resource:action` (e.g. `users:list`, `auth:provider:manage`).

### Sync

Keep backend and webapp `permissions.ts` / `roles.ts` identical. Webapp test `rbac-registry-sync.spec.ts` fails on drift.
