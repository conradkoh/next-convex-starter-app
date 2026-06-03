# Application

Application-specific (non-framework) frontend code.

## Auth (`application/auth/`)

Mirrors backend `permissions.ts` and `roles.ts` (must stay in sync — `__tests__/rbac-registry-sync.spec.ts`).

| Export                               | Purpose                                                  |
| ------------------------------------ | -------------------------------------------------------- |
| `useHasPermission(permission)`       | Hook; reads `authState.permissions` from `auth.getState` |
| `<RequirePermission permission="…">` | Conditional render                                       |
| `AdminGuard`                         | `modules/admin/AdminGuard.tsx` — requires `admin:access` |

### Add a permission

1. Register in **both** `permissions.ts` files (webapp + `services/backend/application/auth/permissions.ts`).
2. Grant in **both** `roles.ts` files.
3. UI: `useHasPermission('your:permission')` or `<RequirePermission permission="…">`.

Use `authState.permissions` (server-resolved). Do not re-derive from `accessLevel` in new code.

### Add a role

Append to `roleDefinitions` in both packages. Custom roles are not assignable until Phase 1b (`users.roleNames`).

### Reference

- Admin link: `components/UserMenu.tsx` (`admin:access`)
- Admin layout: `modules/admin/AdminGuard.tsx`
