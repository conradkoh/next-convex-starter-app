import { ConvexError } from 'convex/values';

import type { Permission } from './permissions';
import { hasPermission } from './resolve';
import type { UserForPermissions } from './resolve';
import type { Id } from '../../convex/_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../../convex/_generated/server';

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
    throw new ConvexError('User not found');
  }
  requirePermissionForUser(user, permission);
}

/**
 * Throws when the user document does not hold the required permission.
 */
export function requirePermissionForUser(user: UserForPermissions, permission: Permission): void {
  if (!hasPermission(user, permission)) {
    throw new ConvexError(`Forbidden: missing permission ${permission}`);
  }
}
