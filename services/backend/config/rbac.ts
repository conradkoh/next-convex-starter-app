/**
 * RBAC Configuration
 *
 * This file defines the permissions, roles, and their relationships for the application.
 * Forked projects can modify this file to add custom permissions and roles.
 *
 * ## How to Extend
 *
 * 1. Add new permissions to CUSTOM_PERMISSIONS array
 * 2. Add new roles to CUSTOM_ROLES array
 * 3. Define role-permission mappings in CUSTOM_ROLE_PERMISSIONS
 * 4. Run the seed function to update the database
 *
 * ## Example: Adding a "moderator" role
 *
 * ```typescript
 * // Add custom permissions
 * export const CUSTOM_PERMISSIONS: PermissionDefinition[] = [
 *   {
 *     name: 'moderation.ban_user',
 *     displayName: 'Ban Users',
 *     description: 'Ability to ban users from the platform',
 *     resource: 'moderation',
 *     action: 'write',
 *   },
 * ];
 *
 * // Add custom roles
 * export const CUSTOM_ROLES: RoleDefinition[] = [
 *   {
 *     name: 'moderator',
 *     displayName: 'Moderator',
 *     description: 'Can moderate content and users',
 *     isSystemRole: false, // Can be deleted
 *   },
 * ];
 *
 * // Map permissions to roles
 * export const CUSTOM_ROLE_PERMISSIONS: RolePermissionMapping = {
 *   moderator: [
 *     'users.read',
 *     'moderation.ban_user',
 *     'discussion.manage',
 *   ],
 * };
 * ```
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Permission definition for seeding the database.
 */
export interface PermissionDefinition {
  name: string;
  displayName: string;
  description: string;
  resource: string;
  action: string;
}

/**
 * Role definition for seeding the database.
 */
export interface RoleDefinition {
  name: string;
  displayName: string;
  description: string;
  isSystemRole: boolean;
}

/**
 * Mapping of role names to their granted permissions.
 */
export type RolePermissionMapping = Record<string, string[]>;

// ============================================================================
// Core Permissions (DO NOT MODIFY)
// ============================================================================

/**
 * Core permissions provided by the starter app.
 * These should not be modified directly.
 */
export const CORE_PERMISSIONS: PermissionDefinition[] = [
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

// ============================================================================
// Core Roles (DO NOT MODIFY)
// ============================================================================

/**
 * Core roles provided by the starter app.
 * These should not be modified directly.
 */
export const CORE_ROLES: RoleDefinition[] = [
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
 * Core role-permission mappings.
 * system_admin uses wildcard (*) so doesn't need explicit mappings.
 */
export const CORE_ROLE_PERMISSIONS: RolePermissionMapping = {
  user: [
    'attendance.read',
    'attendance.write',
    'presentation.read',
    'discussion.read',
    'discussion.write',
    'checklist.read',
    'checklist.write',
  ],
  // system_admin has wildcard permission, no explicit mapping needed
};

// ============================================================================
// Custom Permissions (EXTEND HERE)
// ============================================================================

/**
 * Add your custom permissions here.
 * These will be merged with core permissions during seeding.
 *
 * @example
 * export const CUSTOM_PERMISSIONS: PermissionDefinition[] = [
 *   {
 *     name: 'billing.read',
 *     displayName: 'View Billing',
 *     description: 'View billing information and invoices',
 *     resource: 'billing',
 *     action: 'read',
 *   },
 * ];
 */
export const CUSTOM_PERMISSIONS: PermissionDefinition[] = [];

// ============================================================================
// Custom Roles (EXTEND HERE)
// ============================================================================

/**
 * Add your custom roles here.
 * These will be merged with core roles during seeding.
 *
 * @example
 * export const CUSTOM_ROLES: RoleDefinition[] = [
 *   {
 *     name: 'billing_admin',
 *     displayName: 'Billing Administrator',
 *     description: 'Manages billing and subscriptions',
 *     isSystemRole: false,
 *   },
 * ];
 */
export const CUSTOM_ROLES: RoleDefinition[] = [];

// ============================================================================
// Custom Role-Permission Mappings (EXTEND HERE)
// ============================================================================

/**
 * Add your custom role-permission mappings here.
 * These will be merged with core mappings during seeding.
 *
 * @example
 * export const CUSTOM_ROLE_PERMISSIONS: RolePermissionMapping = {
 *   billing_admin: [
 *     'billing.read',
 *     'billing.write',
 *     'billing.manage',
 *   ],
 * };
 */
export const CUSTOM_ROLE_PERMISSIONS: RolePermissionMapping = {};

// ============================================================================
// Merged Configuration (Used by seeding)
// ============================================================================

/**
 * All permissions (core + custom).
 */
export const ALL_PERMISSIONS: PermissionDefinition[] = [...CORE_PERMISSIONS, ...CUSTOM_PERMISSIONS];

/**
 * All roles (core + custom).
 */
export const ALL_ROLES: RoleDefinition[] = [...CORE_ROLES, ...CUSTOM_ROLES];

/**
 * All role-permission mappings (core + custom).
 */
export const ALL_ROLE_PERMISSIONS: RolePermissionMapping = {
  ...CORE_ROLE_PERMISSIONS,
  ...CUSTOM_ROLE_PERMISSIONS,
};
