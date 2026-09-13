import { Migrations, type MigrationFunctionReference } from '@convex-dev/migrations';

import { components, internal } from './_generated/api.js';
import type { DataModel } from './_generated/dataModel.js';
import { query } from './_generated/server.js';

export const migrations = new Migrations<DataModel>(components.migrations);

/**
 * General-purpose runner to execute any migration by name.
 * Usage: npx convex run migrations:run '{fn: "migrations:myMigration"}'
 */
export const run = migrations.runner();

// ========================================
// Migration Definitions
// ========================================

/**
 * Migration: Remove deprecated session expiration fields.
 * Sets `expiresAt` and `expiresAtLabel` to undefined on all sessions.
 */
export const unsetSessionExpiration = migrations.define({
  table: 'sessions',
  migrateOne: async (_ctx, session) => {
    if (session.expiresAt !== undefined || session.expiresAtLabel !== undefined) {
      return {
        expiresAt: undefined,
        expiresAtLabel: undefined,
      };
    }
  },
});

/**
 * Migration: Set default access level for users.
 * Sets `accessLevel` to 'user' for all users where it is undefined.
 */
export const setUserAccessLevelDefault = migrations.define({
  table: 'users',
  migrateOne: async (_ctx, user) => {
    if (user.accessLevel === undefined) {
      return {
        accessLevel: 'user' as const,
      };
    }
  },
});

/**
 * Migration: Backfill roleNames from legacy accessLevel.
 * system_admin → ['system_admin'], all others → ['user'].
 */
export const backfillUserRoleNames = migrations.define({
  table: 'users',
  migrateOne: async (_ctx, user) => {
    if (user.roleNames !== undefined) {
      return;
    }
    const roleNames =
      user.accessLevel === 'system_admin' ? (['system_admin'] as const) : (['user'] as const);
    return { roleNames: [...roleNames] };
  },
});

/**
 * Migration: Strip legacy `manager` role from roleNames.
 * Starter now ships only `user` and `system_admin`; forks add custom roles.
 */
export const stripManagerRoleNames = migrations.define({
  table: 'users',
  migrateOne: async (_ctx, user) => {
    if (!user.roleNames?.includes('manager')) {
      return;
    }
    const filtered = user.roleNames.filter((role) => role !== 'manager');
    return { roleNames: filtered.length > 0 ? filtered : ['user'] };
  },
});

// ========================================
// Batch Runners
// ========================================

/**
 * Run all migrations in order.
 * Usage: npx convex run migrations:runAll
 */
const allMigrationReferences = [
  internal.migrations.unsetSessionExpiration,
  internal.migrations.setUserAccessLevelDefault,
  internal.migrations.backfillUserRoleNames,
  internal.migrations.stripManagerRoleNames,
] as unknown as MigrationFunctionReference[];

export const runAll = migrations.runner(allMigrationReferences);

/**
 * Returns status for the migrations in the current, ordered migration plan.
 *
 * This is intentionally scoped to `allMigrationReferences` rather than
 * returning every migration known to the component, since old migrations may
 * have been removed from the plan but remain in the component's history.
 * The one-off migration script uses this to report and poll only the work in
 * the current plan.
 */
export const getRunAllStatus = query({
  args: {},
  handler: async (ctx) => {
    // @convex-dev/migrations returns explicitly named statuses newest-first;
    // expose the same oldest-first order used by runAll's serial plan.
    const statuses = await migrations.getStatus(ctx, {
      migrations: allMigrationReferences,
    });
    return statuses.reverse();
  },
});
