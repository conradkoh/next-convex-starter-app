import type { Permission } from './permissions';
import { SYSTEM_ADMIN_ACCESS_PERMISSION } from './permissions';
import { hasPermission } from './resolve';
import type { UserForPermissions } from './resolve';
import type { Id } from '../../convex/_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../../convex/_generated/server';
import { appError } from '../../modules/errors/appError';

type AuthCtx = QueryCtx | MutationCtx;

/**
 * Throws when the user does not hold the required permission.
 */
export async function requirePermission(
  ctx: AuthCtx,
  userId: Id<'users'>,
  permission: Permission
): Promise<void> {
  const user = await ctx.db.get('users', userId);
  if (!user) {
    throw appError('NOT_AUTHENTICATED', 'Not authenticated');
  }
  requirePermissionForUser(user, permission);
}

/**
 * Throws when the user document does not hold the required permission.
 */
export function requirePermissionForUser(user: UserForPermissions, permission: Permission): void {
  if (!hasPermission(user, permission)) {
    throw appError('FORBIDDEN', 'You do not have permission to perform this action', {
      permission,
    });
  }
}

/**
 * Requires an authenticated user with the given permission.
 */
export function requireAuthenticatedPermission<T extends UserForPermissions>(
  user: T | null | undefined,
  permission: Permission,
  options?: {
    /** Copy for the unauthenticated case. Must read as "not signed in", never as a permission failure. */
    unauthorizedMessage?: string;
  }
): asserts user is T {
  if (!user) {
    throw appError('NOT_AUTHENTICATED', options?.unauthorizedMessage ?? 'You must be logged in');
  }
  requirePermissionForUser(user, permission);
}

/**
 * Requires an authenticated user with system administrator access.
 * Use for platform system-admin endpoints (e.g. Google Auth config).
 */
export function requireSystemAdminAccess<T extends UserForPermissions>(
  user: T | null | undefined,
  options?: {
    /** Copy for the unauthenticated case. Must read as "not signed in", never as a permission failure. */
    unauthorizedMessage?: string;
  }
): asserts user is T {
  requireAuthenticatedPermission(user, SYSTEM_ADMIN_ACCESS_PERMISSION, options);
}
