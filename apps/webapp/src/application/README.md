# Application

Application-specific (non-framework) frontend code.

## Auth (`application/auth/`)

Mirrors backend `permissions.ts` and `roles.ts` (must stay in sync — see `__tests__/rbac-registry-sync.spec.ts`).

| Export                                 | Purpose                                                |
| -------------------------------------- | ------------------------------------------------------ |
| `useHasPermission(permission)`         | Hook; reads `authState.permissions`                    |
| `<RequirePermission permission="...">` | Conditional render                                     |
| `AdminGuard`                           | Uses `admin:access` via `modules/admin/AdminGuard.tsx` |

**Extend:** see [RBAC developer guide](../../../../docs/application/auth/rbac-foundation.md) — register permission in both packages, then use hook or component.
