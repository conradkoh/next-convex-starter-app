# Application

Application-specific (non-framework) backend code.

## Auth (`application/auth/`)

Declarative RBAC — permissions and roles in code, guards in Convex.

| File                   | Purpose                                               |
| ---------------------- | ----------------------------------------------------- |
| `permissions.ts`       | Registry; add keys here first                         |
| `roles.ts`             | `roleDefinitions` and grants                          |
| `resolve.ts`           | `hasPermission`, `getResolvedPermissionsForUser`      |
| `requirePermission.ts` | `requirePermission`, `requireAuthenticatedPermission` |

**Extend:** see [RBAC developer guide](../../../../docs/application/auth/rbac-foundation.md) — add permission → grant role → guard handler.

`auth.getState` exposes `permissions: Permission[]` for the webapp.
