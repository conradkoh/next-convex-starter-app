import { describe, expect, it } from 'vitest';

import {
  buildPwaManifest,
  DEFAULT_PWA_START_URL,
  getPwaStartUrlFromLocation,
} from '@/modules/pwa/pwa-manifest-config';

describe('pwa manifest config', () => {
  it('uses provided start_url in manifest', () => {
    expect(buildPwaManifest('/app/profile').start_url).toBe('/app/profile');
  });

  it('defaults server fallback to /app', () => {
    expect(DEFAULT_PWA_START_URL).toBe('/app');
  });
});

describe('getPwaStartUrlFromLocation', () => {
  it('combines pathname and search', () => {
    expect(getPwaStartUrlFromLocation('/app/profile', '?tab=settings')).toBe(
      '/app/profile?tab=settings'
    );
  });

  it('normalizes empty pathname to root', () => {
    expect(getPwaStartUrlFromLocation('', '')).toBe('/');
  });
});
