import { describe, expect, it } from 'bun:test';

import { resolveDevTarget } from './convex-target';

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
