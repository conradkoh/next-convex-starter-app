import { describe, expect, it } from 'bun:test';

import type { ConvexTarget } from './convex-target';
import { devMigrationSkipReason, devStartRefusal } from './dev-migrations';
import { waitForAcceptance } from './migrate-lib';

const local: ConvexTarget = {
  kind: 'local',
  deployment: 'local:local-acme-demo-2',
  url: 'http://127.0.0.1:3210',
};
const hosted: ConvexTarget = {
  kind: 'hosted-dev',
  deployment: 'dev:happy-animal-123',
  url: 'https://happy-animal-123.convex.cloud',
};
const prod: ConvexTarget = { kind: 'prod-without-key', deployment: 'prod:happy-animal-123' };
const unconfigured: ConvexTarget = { kind: 'unconfigured' };

describe('devMigrationSkipReason', () => {
  it('runs migrations for local and hosted development deployments', () => {
    expect(devMigrationSkipReason(local, {})).toBeUndefined();
    expect(devMigrationSkipReason(hosted, {})).toBeUndefined();
  });

  it('skips with a reason for an unconfigured target', () => {
    expect(devMigrationSkipReason(unconfigured, {})).toContain(
      'no development deployment is configured'
    );
  });

  it('skips for any target when SKIP_DEV_MIGRATIONS is exactly 1', () => {
    expect(devMigrationSkipReason(hosted, { SKIP_DEV_MIGRATIONS: '1' })).toContain(
      'SKIP_DEV_MIGRATIONS=1'
    );
    expect(devMigrationSkipReason(hosted, { SKIP_DEV_MIGRATIONS: '0' })).toBeUndefined();
  });
});

describe('devStartRefusal', () => {
  it('refuses to start dev for a production deployment selected without a deploy key', () => {
    const message = devStartRefusal(prod);
    expect(message).toContain('Refusing to start Convex dev');
    expect(message).toContain('prod:happy-animal-123');
  });

  it('lets dev start for local, hosted, and unconfigured targets', () => {
    expect(devStartRefusal(local)).toBeUndefined();
    expect(devStartRefusal(hosted)).toBeUndefined();
    expect(devStartRefusal(unconfigured)).toBeUndefined();
  });
});

describe('waitForAcceptance', () => {
  it('resolves once the probe accepts, after earlier failures', async () => {
    let calls = 0;
    await waitForAcceptance(
      async () => {
        calls += 1;
        if (calls < 3) throw new Error('not up yet');
      },
      { timeoutMs: 5_000, intervalMs: 1 }
    );
    expect(calls).toBe(3);
  });

  it('fails with a timeout that carries the last probe error', async () => {
    await expect(
      waitForAcceptance(
        async () => {
          throw new Error('connection refused');
        },
        { timeoutMs: 20, intervalMs: 1 }
      )
    ).rejects.toThrow(/Timed out.*connection refused/);
  });

  it('fails within its timeout when a probe never settles', async () => {
    await expect(
      waitForAcceptance(() => new Promise<never>(() => {}), { timeoutMs: 30, intervalMs: 1 })
    ).rejects.toThrow(/Timed out/);
  });
});
