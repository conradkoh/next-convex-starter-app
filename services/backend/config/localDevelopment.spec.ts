import { afterEach, describe, expect, it, vi } from 'vitest';

import { isLocalDevelopment, isLoopbackUrl } from './localDevelopment';

describe('isLoopbackUrl', () => {
  it.each([
    'http://127.0.0.1:3210',
    'http://localhost:3210',
    'http://[::1]:3210',
    'http://0.0.0.0:3210',
  ])('returns true for loopback URL %s', (url) => {
    expect(isLoopbackUrl(url)).toBe(true);
  });

  it.each([
    'https://happy-animal-123.convex.cloud',
    'https://127.0.0.1.evil.com',
    'https://example.com/127.0.0.1',
    '',
    undefined,
    null,
    'not a url',
  ])('returns false for non-loopback value %s', (url) => {
    expect(isLoopbackUrl(url)).toBe(false);
  });
});

describe('isLocalDevelopment', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns true when CONVEX_CLOUD_URL is a loopback URL', () => {
    vi.stubEnv('CONVEX_CLOUD_URL', 'http://127.0.0.1:3210');
    expect(isLocalDevelopment()).toBe(true);
  });

  it('returns false when CONVEX_CLOUD_URL is a hosted deployment', () => {
    vi.stubEnv('CONVEX_CLOUD_URL', 'https://happy-animal-123.convex.cloud');
    expect(isLocalDevelopment()).toBe(false);
  });

  it('returns false when CONVEX_CLOUD_URL is not set', () => {
    vi.stubEnv('CONVEX_CLOUD_URL', undefined);
    expect(isLocalDevelopment()).toBe(false);
  });
});
