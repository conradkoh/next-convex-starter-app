import type { Doc, Id } from '../../convex/_generated/dataModel';

/**
 * RBAC Type Definitions
 * Core types for the Role-Based Access Control system.
 */

// ============================================================================
// Permission Types
// ============================================================================

/**
 * Permission action types that can be performed on resources.
 */
export type PermissionAction = 'read' | 'write' | 'delete' | 'manage';

/**
 * Resource categories for permissions.
 * Extensible as new features are added.
 */
export type PermissionResource =
  | 'users'
  | 'settings'
  | 'auth'
  | 'attendance'
  | 'presentation'
  | 'discussion'
  | 'checklist';

/**
 * Permission name format: {resource}.{action}
 * Examples: 'users.read', 'settings.write', 'auth.provider.manage'
 */
export type PermissionName = string;

/**
 * Special permission for system admins - grants all permissions.
 */
export const WILDCARD_PERMISSION = '*';

// ============================================================================
// Role Types
// ============================================================================

/**
 * System-defined role names that cannot be deleted.
 */
export type SystemRoleName = 'user' | 'system_admin';

/**
 * Role name type - can be system or custom roles.
 */
export type RoleName = SystemRoleName | string;

// ============================================================================
// Document Types (from schema)
// ============================================================================

export type RbacRole = Doc<'rbac_roles'>;
export type RbacPermission = Doc<'rbac_permissions'>;
export type RbacRolePermission = Doc<'rbac_rolePermissions'>;
export type RbacUserRole = Doc<'rbac_userRoles'>;

// ============================================================================
// ID Types
// ============================================================================

export type RbacRoleId = Id<'rbac_roles'>;
export type RbacPermissionId = Id<'rbac_permissions'>;

// ============================================================================
// Input Types for RBAC Operations
// ============================================================================

/**
 * Input for creating a new permission.
 */
export interface CreatePermissionInput {
  name: string;
  displayName: string;
  description: string;
  resource: string;
  action: string;
}

/**
 * Input for creating a new role.
 */
export interface CreateRoleInput {
  name: string;
  displayName: string;
  description: string;
  isSystemRole?: boolean;
}

/**
 * Input for assigning a role to a user.
 */
export interface AssignRoleInput {
  userId: Id<'users'>;
  roleId: RbacRoleId;
  assignedBy?: Id<'users'>;
}

// ============================================================================
// Result Types
// ============================================================================

/**
 * User's effective permissions after role resolution.
 */
export interface UserPermissions {
  roles: RbacRole[];
  permissions: Set<PermissionName>;
  hasWildcard: boolean;
}

/**
 * Permission check result with details.
 */
export interface PermissionCheckResult {
  hasPermission: boolean;
  grantedBy?: RoleName; // Which role granted this permission
  reason?: string; // Explanation for debugging
}

// ============================================================================
// Default Permissions List
// ============================================================================

/**
 * Initial permissions to seed the database.
 * Based on current application features.
 */
export const INITIAL_PERMISSIONS: CreatePermissionInput[] = [
  // User management
  {
    name: 'users.read',
    displayName: 'View Users',
    description: 'View user information and list users',
    resource: 'users',
    action: 'read',
  },
  {
    name: 'users.write',
    displayName: 'Edit Users',
    description: 'Create and update user information',
    resource: 'users',
    action: 'write',
  },
  {
    name: 'users.delete',
    displayName: 'Delete Users',
    description: 'Delete user accounts',
    resource: 'users',
    action: 'delete',
  },
  {
    name: 'users.manage',
    displayName: 'Manage Users',
    description: 'Full user management including role assignment',
    resource: 'users',
    action: 'manage',
  },

  // Auth provider configuration
  {
    name: 'auth.provider.read',
    displayName: 'View Auth Providers',
    description: 'View authentication provider configuration',
    resource: 'auth',
    action: 'read',
  },
  {
    name: 'auth.provider.write',
    displayName: 'Configure Auth Providers',
    description: 'Create and update authentication provider settings',
    resource: 'auth',
    action: 'write',
  },
  {
    name: 'auth.provider.manage',
    displayName: 'Manage Auth Providers',
    description: 'Full control over authentication providers',
    resource: 'auth',
    action: 'manage',
  },

  // System settings
  {
    name: 'settings.read',
    displayName: 'View Settings',
    description: 'View system settings',
    resource: 'settings',
    action: 'read',
  },
  {
    name: 'settings.write',
    displayName: 'Modify Settings',
    description: 'Modify system settings',
    resource: 'settings',
    action: 'write',
  },

  // Attendance
  {
    name: 'attendance.read',
    displayName: 'View Attendance',
    description: 'View attendance records',
    resource: 'attendance',
    action: 'read',
  },
  {
    name: 'attendance.write',
    displayName: 'Record Attendance',
    description: 'Create and update attendance records',
    resource: 'attendance',
    action: 'write',
  },
  {
    name: 'attendance.manage',
    displayName: 'Manage Attendance',
    description: 'Full attendance management including deletion',
    resource: 'attendance',
    action: 'manage',
  },

  // Presentation
  {
    name: 'presentation.read',
    displayName: 'View Presentations',
    description: 'View presentation state',
    resource: 'presentation',
    action: 'read',
  },
  {
    name: 'presentation.write',
    displayName: 'Control Presentations',
    description: 'Control presentation slides and state',
    resource: 'presentation',
    action: 'write',
  },
  {
    name: 'presentation.manage',
    displayName: 'Manage Presentations',
    description: 'Full presentation management',
    resource: 'presentation',
    action: 'manage',
  },

  // Discussion
  {
    name: 'discussion.read',
    displayName: 'View Discussions',
    description: 'View discussions and messages',
    resource: 'discussion',
    action: 'read',
  },
  {
    name: 'discussion.write',
    displayName: 'Participate in Discussions',
    description: 'Create messages and participate in discussions',
    resource: 'discussion',
    action: 'write',
  },
  {
    name: 'discussion.manage',
    displayName: 'Manage Discussions',
    description: 'Full discussion management including moderation',
    resource: 'discussion',
    action: 'manage',
  },

  // Checklist
  {
    name: 'checklist.read',
    displayName: 'View Checklists',
    description: 'View checklists and items',
    resource: 'checklist',
    action: 'read',
  },
  {
    name: 'checklist.write',
    displayName: 'Edit Checklists',
    description: 'Create and update checklist items',
    resource: 'checklist',
    action: 'write',
  },
  {
    name: 'checklist.manage',
    displayName: 'Manage Checklists',
    description: 'Full checklist management',
    resource: 'checklist',
    action: 'manage',
  },
];

/**
 * Default roles to seed the database.
 */
export const DEFAULT_ROLES: CreateRoleInput[] = [
  {
    name: 'user',
    displayName: 'User',
    description: 'Default role for all users with basic access permissions',
    isSystemRole: true,
  },
  {
    name: 'system_admin',
    displayName: 'System Administrator',
    description: 'Full system access with all permissions',
    isSystemRole: true,
  },
];

/**
 * Permissions granted to the default 'user' role.
 */
export const USER_ROLE_PERMISSIONS: PermissionName[] = [
  'attendance.read',
  'attendance.write',
  'presentation.read',
  'discussion.read',
  'discussion.write',
  'checklist.read',
  'checklist.write',
];
