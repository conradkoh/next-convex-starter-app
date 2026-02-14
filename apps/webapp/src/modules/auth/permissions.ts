'use client';

import { useAuthState } from './AuthProvider';

/**
 * Permission name type for frontend use.
 */
export type PermissionName = string;

/**
 * Special permission that grants all access (system_admin only).
 */
export const WILDCARD_PERMISSION = '*';

/**
 * Hook to check if the current user has a specific permission.
 *
 * @param permission - The permission to check (e.g., 'users.read')
 * @returns true if user has the permission, false otherwise, undefined if loading
 *
 * @example
 * ```tsx
 * function AdminSettings() {
 *   const canWriteSettings = useHasPermission('settings.write');
 *
 *   if (canWriteSettings === undefined) {
 *     return <Loading />;
 *   }
 *
 *   if (!canWriteSettings) {
 *     return <AccessDenied />;
 *   }
 *
 *   return <SettingsForm />;
 * }
 * ```
 */
export function useHasPermission(permission: PermissionName): boolean | undefined {
  const authState = useAuthState();

  if (authState === undefined) {
    return undefined; // Still loading
  }

  if (authState.state !== 'authenticated') {
    return false;
  }

  return hasPermission(authState.permissions, permission);
}

/**
 * Hook to check if the current user has ALL of the specified permissions.
 *
 * @param permissions - Array of permissions to check
 * @returns true if user has all permissions, false otherwise, undefined if loading
 */
export function useHasAllPermissions(permissions: PermissionName[]): boolean | undefined {
  const authState = useAuthState();

  if (authState === undefined) {
    return undefined;
  }

  if (authState.state !== 'authenticated') {
    return false;
  }

  return permissions.every((p) => hasPermission(authState.permissions, p));
}

/**
 * Hook to check if the current user has ANY of the specified permissions.
 *
 * @param permissions - Array of permissions to check
 * @returns true if user has at least one permission, false otherwise, undefined if loading
 */
export function useHasAnyPermission(permissions: PermissionName[]): boolean | undefined {
  const authState = useAuthState();

  if (authState === undefined) {
    return undefined;
  }

  if (authState.state !== 'authenticated') {
    return false;
  }

  return permissions.some((p) => hasPermission(authState.permissions, p));
}

/**
 * Hook to check if the current user has a specific role.
 *
 * @param role - The role name to check (e.g., 'system_admin')
 * @returns true if user has the role, false otherwise, undefined if loading
 */
export function useHasRole(role: string): boolean | undefined {
  const authState = useAuthState();

  if (authState === undefined) {
    return undefined;
  }

  if (authState.state !== 'authenticated') {
    return false;
  }

  return authState.roles.includes(role);
}

/**
 * Hook to get all permissions for the current user.
 *
 * @returns Array of permission names, empty array if not authenticated, undefined if loading
 */
export function usePermissions(): PermissionName[] | undefined {
  const authState = useAuthState();

  if (authState === undefined) {
    return undefined;
  }

  if (authState.state !== 'authenticated') {
    return [];
  }

  return authState.permissions;
}

/**
 * Hook to get all roles for the current user.
 *
 * @returns Array of role names, empty array if not authenticated, undefined if loading
 */
export function useRoles(): string[] | undefined {
  const authState = useAuthState();

  if (authState === undefined) {
    return undefined;
  }

  if (authState.state !== 'authenticated') {
    return [];
  }

  return authState.roles;
}

/**
 * Check if a permission exists in a permissions array.
 * Handles wildcard permissions.
 *
 * @param permissions - Array of user's permissions
 * @param permission - The permission to check
 * @returns true if permission is granted
 */
export function hasPermission(permissions: PermissionName[], permission: PermissionName): boolean {
  // Wildcard grants all permissions
  if (permissions.includes(WILDCARD_PERMISSION)) {
    return true;
  }

  // Exact match
  if (permissions.includes(permission)) {
    return true;
  }

  // Resource wildcard (e.g., 'users.*' grants 'users.read')
  const [resource] = permission.split('.');
  if (permissions.includes(`${resource}.*`)) {
    return true;
  }

  return false;
}
