import { describe, expect, it } from 'bun:test';

import {
  buildConvexRunArgs,
  describeConvexTarget,
  resolveConvexTarget,
  resolveDevTarget,
} from './convex-target';

const hostedEnvFile = [
  'CONVEX_DEPLOYMENT=dev:happy-animal-123 # team: acme, project: demo',
  'VITE_CONVEX_URL=https://happy-animal-123.convex.cloud',
  '',
].join('\n');

const localEnvFile = [
  'CONVEX_DEPLOYMENT=local:local-acme-demo-2 # team: acme, project: demo',
  'VITE_CONVEX_URL=http://127.0.0.1:3210',
  '',
].join('\n');

describe('resolveDevTarget', () => {
  it('classifies a hosted dev deployment from .env.local as hosted-dev', () => {
    expect(resolveDevTarget({ envFile: hostedEnvFile })).toEqual({
      kind: 'hosted-dev',
      deployment: 'dev:happy-animal-123',
      url: 'https://happy-animal-123.convex.cloud',
    });
  });

  it('classifies a local: deployment with a loopback URL as local', () => {
    expect(resolveDevTarget({ envFile: localEnvFile })).toEqual({
      kind: 'local',
      deployment: 'local:local-acme-demo-2',
      url: 'http://127.0.0.1:3210',
    });
  });

  it('classifies a loopback URL as local even with a dev: deployment name', () => {
    expect(
      resolveDevTarget({ envFile: 'CONVEX_DEPLOYMENT=dev:x-1\nCONVEX_URL=http://localhost:3210\n' })
        .kind
    ).toBe('local');
  });

  it('recognises the loopback hosts from the existing rule', () => {
    for (const url of ['http://127.0.0.1:3210', 'http://localhost:3210', 'http://[::1]:3210']) {
      expect(resolveDevTarget({ env: { VITE_CONVEX_URL: url } }).kind).toBe('local');
    }
    expect(
      resolveDevTarget({ env: { VITE_CONVEX_URL: 'https://wonderful-raven-192.convex.cloud' } })
        .kind
    ).toBe('hosted-dev');
  });

  it('lets process env CONVEX_DEPLOYMENT override .env.local', () => {
    expect(
      resolveDevTarget({ env: { CONVEX_DEPLOYMENT: 'local:other-2' }, envFile: hostedEnvFile })
    ).toEqual({
      kind: 'local',
      deployment: 'local:other-2',
      url: 'https://happy-animal-123.convex.cloud',
    });
  });
});

describe('resolveConvexTarget', () => {
  it('targets production and passes --prod when CONVEX_DEPLOY_KEY is set, even with a dev .env.local', () => {
    const target = resolveConvexTarget({ deployKey: 'test-deploy-key', envFile: hostedEnvFile });
    expect(target).toEqual({ kind: 'production' });
    expect(buildConvexRunArgs(target, 'migrations:runAll')).toEqual([
      'run',
      'migrations:runAll',
      '--prod',
    ]);
  });

  it('treats an empty CONVEX_DEPLOY_KEY as unset', () => {
    expect(resolveConvexTarget({ deployKey: '', envFile: hostedEnvFile }).kind).toBe('hosted-dev');
  });

  it('targets a hosted dev deployment from .env.local without --prod, and does not call it local', () => {
    const target = resolveConvexTarget({ envFile: hostedEnvFile });
    expect(target.kind).toBe('hosted-dev');
    expect(buildConvexRunArgs(target, 'migrations:runAll')).toEqual(['run', 'migrations:runAll']);
  });

  it('targets a local deployment from .env.local without --prod', () => {
    const target = resolveConvexTarget({ envFile: localEnvFile });
    expect(target.kind).toBe('local');
    expect(buildConvexRunArgs(target, 'migrations:runAll')).toEqual(['run', 'migrations:runAll']);
  });
});

describe('describeConvexTarget', () => {
  it('labels production', () => {
    expect(describeConvexTarget({ kind: 'production' })).toContain('PRODUCTION');
  });

  it('labels a hosted dev deployment with its name and URL, never as LOCAL', () => {
    const label = describeConvexTarget(resolveConvexTarget({ envFile: hostedEnvFile }));
    expect(label).toContain('HOSTED');
    expect(label).toContain('dev:happy-animal-123');
    expect(label).toContain('https://happy-animal-123.convex.cloud');
    expect(label).not.toContain('LOCAL');
  });

  it('labels a local deployment as LOCAL', () => {
    expect(describeConvexTarget(resolveConvexTarget({ envFile: localEnvFile }))).toContain('LOCAL');
  });
});
