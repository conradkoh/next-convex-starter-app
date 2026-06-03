# RBAC Foundation — Developer Guide

Application-layer roles and permissions live in **`application/auth`** (backend + webapp). The registry is type-safe, version-controlled, and extended in code — not in the database.

| Layer    | Location                                                                                                        |
| -------- | --------------------------------------------------------------------------------------------------------------- |
| Backend  | `services/backend/application/auth/`                                                                            |
| Frontend | `apps/webapp/src/application/auth/` (mirror backend `permissions.ts` + `roles.ts`)                              |
| Legacy   | `modules/auth/accessControl.ts` — `accessLevel` / `isSystemAdmin` (still used; prefer permissions for new code) |

Full DB-backed RBAC (admin UI, dynamic roles) is a separate effort: [`docs/features/rbac-implementation-plan.md`](../../features/rbac-implementation-plan.md).

---

## Add a permission

**1. Register** in both `permissions.ts` files (backend and webapp — keep them identical):

```typescript
export const permissions = {
  'reports:export': { description: 'Export reports' },
  // ...
} as const;
```

**2. Grant to role(s)** in both `roles.ts` files:

```typescript
{
  role: 'user',
  permissions: ['attendance:read', 'presentation:read', 'reports:export'] as const,
},
```

For `system_admin`, add the key to the registry only — `systemAdminPermissions` is derived from `allPermissions` automatically.

**3. Guard Convex** (queries/mutations):

```typescript
import { requireAuthenticatedPermission } from '../application/auth/requirePermission';

const user = await getAuthUser(ctx, args);
requireAuthenticatedPermission(user, 'reports:export');
```

Or when you have only `userId`: `await requirePermission(ctx, userId, 'reports:export')`.

**4. Guard UI**:

```typescript
const canExport = useHasPermission('reports:export');

// or
<RequirePermission permission="reports:export" fallback={<AccessDenied />}>
  ...
</RequirePermission>
```

`useHasPermission` and `RequirePermission` read **`authState.permissions`** from `auth.getState` (server-resolved). Do not re-resolve from `accessLevel` in new UI code.

---

## Add a role

Append to `roleDefinitions` in **both** `roles.ts` files:

```typescript
{
  role: 'billing_admin',
  permissions: ['users:read', 'settings:read'] as const satisfies readonly Permission[],
},
```

**Assignment today:** only `users.accessLevel` maps to roles (`user` | `system_admin`) in `resolve.ts` → `getRolesForUser`. Custom roles are defined but not assignable until Phase 1b (`users.roleNames`). Do not ship placeholder roles uncommented in `roleDefinitions` until assignment exists.

**Phase 1b (planned):** extend `getRolesForUser` to return `user.roleNames ?? ['user']` and migrate assignment off `accessLevel` where needed.

---

## Permission naming

Use **`resource:action`** (colon):

```
users:list
auth:provider:manage
```

Wildcards in role grants (rare; `system_admin` uses an explicit full list instead):

- `*` — any permission
- `users:*` — any `users:` permission

---

## Auth state

Authenticated sessions include:

```typescript
{
  state: 'authenticated',
  user: Doc<'users'>,
  accessLevel: 'user' | 'system_admin',
  permissions: Permission[],  // use this for UI checks
  isSystemAdmin: boolean,     // legacy; prefer permissions.includes('admin:access')
}
```

Admin areas use **`admin:access`**. `AdminGuard` checks `permissions.includes('admin:access')`.

---

## Keep backend and webapp in sync

Option A (current): duplicate `permissions.ts` and `roles.ts` with a sync comment at the top of each file.

**CI safety:** `apps/webapp/src/application/auth/__tests__/rbac-registry-sync.spec.ts` fails if keys or role grants diverge.

When adding permissions, run:

```bash
pnpm typecheck && pnpm test
```

---

## Reference implementations

| Use case           | Where to look                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------------- |
| Convex admin API   | `services/backend/convex/system/auth/google.ts` — `requireAuthenticatedPermission(..., 'auth:provider:manage')` |
| Admin UI link      | `apps/webapp/src/components/UserMenu.tsx` — `admin:access`                                                      |
| Admin layout guard | `apps/webapp/src/modules/admin/AdminGuard.tsx`                                                                  |
| Resolve / tests    | `application/auth/resolve.ts`, `__tests__/resolve.spec.ts` (both packages)                                      |

---

## APIs (backend)

| Export                                             | Purpose                                |
| -------------------------------------------------- | -------------------------------------- |
| `hasPermission(user, permission)`                  | Boolean check                          |
| `getResolvedPermissionsForUser(user)`              | `Permission[]` for auth state          |
| `requirePermission(ctx, userId, permission)`       | Async guard; throws `ConvexError`      |
| `requireAuthenticatedPermission(user, permission)` | Sync guard when user is already loaded |

---

## Deferred (not in foundation)

- Database roles / admin UI
- `users.roleNames` / multi-role assignment (Phase 1b)
- Resource-instance scopes (`attendance:write:own`) — wrap `hasPermission` in policy functions
- Shared `packages/auth-contract` — extract if duplication becomes painful

---

## Checklist for a feature PR

- [ ] Permission key in **both** `permissions.ts` files
- [ ] Role grant in **both** `roles.ts` files (if not only `system_admin`)
- [ ] Convex handler guarded with `requirePermission` / `requireAuthenticatedPermission`
- [ ] UI gated with `useHasPermission` or `RequirePermission` where needed
- [ ] `pnpm typecheck && pnpm test` (includes registry sync test)
