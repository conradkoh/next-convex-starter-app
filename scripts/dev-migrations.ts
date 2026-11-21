import { type ConvexTarget, describeConvexTarget } from './convex-target';
import {
  describeMigrationError,
  getMigrationStatus,
  runMigrations,
  waitForAcceptance,
} from './migrate-lib';

/** Set to exactly `1` to skip dev migrations for one `pnpm dev` run. */
const SKIP_DEV_MIGRATIONS_ENV = 'SKIP_DEV_MIGRATIONS';

/** How long the dev watcher's deployment may take to answer `convex run`. */
const ACCEPT_TIMEOUT_MS = 120_000;
const ACCEPT_INTERVAL_MS = 2_000;

/** Why dev runs no migrations for this target, or undefined when it should run them. */
export function devMigrationSkipReason(
  target: ConvexTarget,
  env: Record<string, string | undefined>
): string | undefined {
  if (env[SKIP_DEV_MIGRATIONS_ENV] === '1') return `${SKIP_DEV_MIGRATIONS_ENV}=1 is set`;
  return targetSkipReason(target);
}

function targetSkipReason(target: ConvexTarget): string | undefined {
  switch (target.kind) {
    case 'unconfigured':
      return 'no development deployment is configured yet (run `npx convex dev` once in services/backend to set one up)';
    case 'production':
    case 'prod-without-key':
      return 'the target is production, which dev never migrates';
    default:
      return undefined;
  }
}

/** Message to print before refusing to start `convex dev`, or undefined when dev may start. */
export function devStartRefusal(target: ConvexTarget): string | undefined {
  if (target.kind !== 'prod-without-key') return undefined;
  return `Refusing to start Convex dev: ${describeConvexTarget(target)}. Nothing was started and no migrations ran. Set CONVEX_DEPLOYMENT in your shell or services/backend/.env.local to a dev: or local: deployment.`;
}

/** Wait for the deployment to accept `convex run`, then run pending migrations. Throws on failure. */
async function runDevMigrations(target: ConvexTarget): Promise<void> {
  console.log(`🗂️  Dev migrations against ${describeConvexTarget(target)}`);
  await waitForLocalBackend(target);
  await waitForAcceptance(() => getMigrationStatus(target), {
    timeoutMs: ACCEPT_TIMEOUT_MS,
    intervalMs: ACCEPT_INTERVAL_MS,
  });
  await runMigrations(target);
}

/**
 * A local backend must be listening before the first `convex run`: otherwise the CLI
 * starts its own backend for the probe and stops it on exit, taking the watcher's
 * deployment down with it. Hosted deployments are always reachable.
 */
async function waitForLocalBackend(target: ConvexTarget): Promise<void> {
  if (target.kind !== 'local' || !target.url) return;
  const url = target.url;
  await waitForAcceptance(() => fetch(url), {
    timeoutMs: ACCEPT_TIMEOUT_MS,
    intervalMs: ACCEPT_INTERVAL_MS,
  });
}

/** Background entry for `pnpm dev`. Never throws: a failure is a warning, so the watcher keeps running. */
export async function runDevMigrationsSafely(target: ConvexTarget): Promise<void> {
  try {
    await runDevMigrations(target);
  } catch (error) {
    console.warn(
      `\n⚠️  Dev migrations did not complete against ${describeConvexTarget(target)}:\n   ${describeMigrationError(error)}\n   The dev watcher keeps running. Fix the problem, then run \`pnpm migrate\`. Set SKIP_DEV_MIGRATIONS=1 to skip this step.\n`
    );
  }
}
