'use client';

import type { Permission } from './permissions';
import { hasPermission } from './resolve';

import { useAuthState } from '@/modules/auth/AuthProvider';

/**
 * Returns whether the authenticated user holds the given permission.
 */
export function useHasPermission(permission: Permission): boolean {
  const authState = useAuthState();

  if (!authState || authState.state !== 'authenticated') {
    return false;
  }

  return hasPermission(authState.user, permission);
}
