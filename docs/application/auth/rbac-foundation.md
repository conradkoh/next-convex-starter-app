# RBAC Foundation — Design Sketch

> **Status:** Foundation implemented (scaffolds + helpers); migration of call sites is incremental.  
> **Scope:** Application-layer auth module + `requirePermission` API.

## Summary

Introduce an **`application/auth`** module in both the Convex backend and Next.js webapp where the app team **declares roles and permissions in code**. A small permission engine resolves a user's effective permissions and exposes:

- **Backend:** `requirePermission(ctx, userId, permission)` — throws when denied
- **Frontend:** `useHasPermission(permission)` / `<RequirePermission>` — UI gating

This is intentionally **lighter** than the database-first plan in [`docs/features/rbac-implementation-plan.md`](../../features/rbac-implementation-plan.md). That document remains valid for a future phase (admin UI, dynamic roles in DB). This foundation optimizes for **type-safe, version-controlled, easy-to-extend** role definitions first.

---

## Current State

| Piece      | Location                                         | Behavior                                                  |
| ---------- | ------------------------------------------------ | --------------------------------------------------------- |
| User field | `users.accessLevel`                              | `'user' \| 'system_admin'`, optional (defaults to `user`) |
| Helpers    | `services/backend/modules/auth/accessControl.ts` | `isSystemAdmin`, `hasAccessLevel`                         |
| Frontend   | `AdminGuard.tsx`                                 | Binary admin check via auth state                         |

**Gap:** No granular permissions, no custom roles, no shared permission vocabulary between frontend and backend.

---

## Goals (Foundation Phase)

1. **Single place to extend roles** — add a role and its permissions in `application/auth/roles.ts`
2. **Typed permissions** — permission strings are a union type derived from the registry
3. **`requirePermission`** — one-line guard in Convex handlers
4. **Backward compatible** — map existing `accessLevel` to built-in roles (`user`, `system_admin`)
5. **Frontend parity** — same permission names for hooks and guards

## Non-Goals (This Phase)

- Database tables for roles/permissions (see rbac-implementation-plan.md)
- Admin UI to assign roles
- Resource-instance scopes (e.g. "edit only my row") — noted as **Phase 2**
- Permission negation or role hierarchies

---

## Permission Naming

Use **`resource:action`** (colon), aligned with your example:

```
users:list
users:write
settings:read
auth:provider:manage
```

- **resource** — domain noun (`users`, `settings`, `attendance`)
- **action** — verb (`list`, `read`, `write`, `delete`, `manage`)
- Nested resources use extra segments: `auth:provider:manage`

**Wildcards (system_admin only):**

- `*` — all permissions
- `users:*` — all actions on `users`

---

## Proposed File Structure

### Backend (`services/backend/application/auth/`)

```
application/auth/
├── permissions.ts      # Permission registry + Permission type union
├── roles.ts            # Role definitions (extend here)
├── resolve.ts            # getPermissionsForUser(user) → Set<Permission>
├── requirePermission.ts  # requirePermission(ctx, userId, permission)
└── index.ts            # Public exports
```

### Frontend (`apps/webapp/src/application/auth/`)

```
application/auth/
├── permissions.ts      # Re-export or mirror Permission type (see Shared Types)
├── roles.ts            # Same role definitions as backend (or imported from shared)
├── usePermission.ts    # useHasPermission(permission)
├── RequirePermission.tsx
└── index.ts
```

### Documentation

```
docs/application/auth/
└── rbac-foundation.md    # This file
```

### Framework vs application

| Layer               | Responsibility                                                                   |
| ------------------- | -------------------------------------------------------------------------------- |
| `modules/auth/`     | Session, `getAuthUser`, legacy `accessLevel` helpers (unchanged until migration) |
| `application/auth/` | **App-specific** roles, permissions, guards — **you edit this**                  |

---

## Role Definitions (Shape)

Roles are declared as a **const array** merged into a lookup map at build time:

```typescript
// application/auth/roles.ts (illustrative)

export const roleDefinitions = [
  {
    role: 'user',
    permissions: ['attendance:read', 'presentation:read'] as const,
  },
  {
    role: 'manager',
    permissions: ['users:list', 'users:read', 'attendance:manage'] as const,
  },
  {
    role: 'system_admin',
    permissions: ['*'] as const,
  },
] as const;

export type AppRole = (typeof roleDefinitions)[number]['role'];
```

**Extension model:** To add a role, append an object to `roleDefinitions`. Permissions must exist in `permissions.ts` registry (or be added there first) so TypeScript catches typos.

---

## Permission Registry

```typescript
// application/auth/permissions.ts (illustrative)

export const permissions = {
  'users:list': { description: 'List users' },
  'users:read': { description: 'View user details' },
  'users:write': { description: 'Create or update users' },
  // ...
} as const;

export type Permission = keyof typeof permissions;
```

Optional: `allPermissions` array for admin UIs later.

---

## Resolving User → Permissions

**Phase 1 (foundation):** Derive roles from existing `users.accessLevel`:

| `accessLevel`        | Assigned roles |
| -------------------- | -------------- |
| `undefined` / `user` | `user`         |
| `system_admin`       | `system_admin` |

**Phase 1b (soon after):** Support multiple roles per user via optional `users.roleNames: string[]` field (migration adds column; code-defined roles still authoritative for _what each role grants_).

```typescript
// application/auth/resolve.ts (illustrative)

export function getRolesForUser(user: Doc<'users'>): AppRole[] {
  if (user.accessLevel === 'system_admin') return ['system_admin'];
  // Future: return user.roleNames ?? ['user'];
  return ['user'];
}

export function getPermissionsForUser(user: Doc<'users'>): Set<Permission> {
  const roles = getRolesForUser(user);
  return unionPermissionsForRoles(roles, roleDefinitions);
}
```

---

## `requirePermission` (Backend API)

```typescript
// application/auth/requirePermission.ts (illustrative)

import { ConvexError } from 'convex/values';
import type { QueryCtx | MutationCtx } from '../../convex/_generated/server';
import type { Id } from '../../convex/_generated/dataModel';

export async function requirePermission(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
  permission: Permission,
): Promise<void> {
  const user = await ctx.db.get(userId);
  if (!user) throw new ConvexError('User not found');

  if (!hasPermission(user, permission)) {
    throw new ConvexError(`Forbidden: missing permission ${permission}`);
  }
}

// Convenience when you already have the user document
export function requirePermissionForUser(
  user: Doc<'users'>,
  permission: Permission,
): void { /* same check, sync */ }
```

**Usage in a mutation:**

```typescript
import { requirePermission } from '../application/auth/requirePermission';

export const listUsers = query({
  args: { ...SessionIdArg },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx, args);
    await requirePermission(ctx, user._id, 'users:list');
    // ...
  },
});
```

**Wildcard handling:** `system_admin` with `*` grants any permission; `users:*` grants any `users:` permission.

---

## Frontend API

```typescript
// useHasPermission('users:list') → boolean
// <RequirePermission permission="users:list" fallback={<AccessDenied />}>
```

Permissions come from the same `getPermissionsForUser` logic, fed by auth state (extend `AuthState` with `permissions: Permission[]` or compute client-side from `accessLevel` + shared role map).

---

## Shared Types Between Webapp and Backend

**Option A (recommended for foundation):** Duplicate `permissions.ts` + `roles.ts` in both packages with a comment to keep in sync. Lowest friction, no new package.

**Option B:** `packages/auth-contract/` workspace package exporting roles + permission types only. Better DRY; add when duplication hurts.

Start with **Option A**; extract to **Option B** if the team wants a single source of truth before Phase 2.

---

## Migration Path

| Step | Change                                                                    | Breaking? |
| ---- | ------------------------------------------------------------------------- | --------- |
| 1    | Add `application/auth` + docs (this PR)                                   | No        |
| 2    | Implement resolve + `requirePermission`; use alongside `isSystemAdmin`    | No        |
| 3    | Replace `AdminGuard` / `hasAccessLevel` call sites with permission checks | Soft      |
| 4    | Optional DB roles (rbac-implementation-plan.md)                           | No        |

`isSystemAdmin` remains as sugar for `hasPermission(user, '*')` or checking `system_admin` role.

---

## Context-Scoped Permissions (Phase 2 — Open)

Your note: _"hasn't considered how to apply permissions to diff contexts"_.

Possible shapes (pick one in a follow-up PR):

1. **Scoped permission strings:** `attendance:write:own` vs `attendance:write:any`
2. **Second argument:** `requirePermission(ctx, userId, 'attendance:write', { resourceId, ownerId })`
3. **Policy functions:** `canEditAttendance(user, record)` built on top of base permissions

Foundation keeps the API **flat** (`permission` string only); context policies wrap `requirePermission` where needed.

---

## Open Questions for Review

1. **Permission delimiter:** Confirm `resource:action` (colon) vs `resource.action` (dot) from the older RBAC plan doc.
2. **Multiple roles:** Add `users.roleNames` in foundation, or stay on `accessLevel` until DB phase?
3. **Shared package:** Option A (duplicate) vs Option B (`packages/auth-contract`) for v1?
4. **Auth state:** Push `permissions[]` from backend on login, or compute on client from roles?
5. **Relation to DB RBAC plan:** Proceed code-first only, or align schema early with `rbac-implementation-plan.md`?

---

## Implementation Checklist

- [x] `services/backend/application/auth/*` — permissions, roles, resolve, requirePermission
- [x] Unit tests for wildcard + role union logic
- [x] `apps/webapp/src/application/auth/*` — hooks + component
- [x] Reference: `system/auth/google.getConfig` uses `requirePermissionForUser(..., 'auth:provider:manage')`
- [x] Application README auth extension guides
- [ ] Replace remaining `isSystemAdmin` / `AdminGuard` call sites (incremental)
- [ ] `pnpm typecheck && pnpm test` on each PR

---

## References

- Current access control: `services/backend/modules/auth/accessControl.ts`
- Full DB RBAC plan: `docs/features/rbac-implementation-plan.md`
- Application code placeholders: `services/backend/application/README.md`, `apps/webapp/src/application/README.md`
