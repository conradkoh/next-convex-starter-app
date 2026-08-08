import { afterEach, describe, expect, it, vi } from 'vitest';

import { CliConfigNotSetUpError } from './errors';
import { requireEnvironmentUrls } from './store';
import * as templateRepo from './template-repo';
import type { EnvironmentUrls } from './types';
import * as urls from './urls';

const PRODUCTION: EnvironmentUrls = {
  convexUrl: 'https://prod.example.convex.cloud',
  webappUrl: 'https://app.example.vercel.app',
};
const DEVELOPMENT: EnvironmentUrls = {
  convexUrl: 'https://dev.example.convex.cloud',
  webappUrl: 'http://localhost:3000',
};

function captureError(fn: () => unknown): CliConfigNotSetUpError {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(CliConfigNotSetUpError);
    return error as CliConfigNotSetUpError;
  }
  throw new Error('Expected requireEnvironmentUrls to throw');
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('requireEnvironmentUrls', () => {
  it('returns hardcoded production URLs when not a template repo and URLs are configured', () => {
    vi.spyOn(templateRepo, 'isTemplateRepo').mockReturnValue(false);
    vi.spyOn(urls, 'getHardcodedEnvironmentUrls').mockReturnValue(PRODUCTION);

    expect(requireEnvironmentUrls('production')).toEqual(PRODUCTION);
  });

  it('returns hardcoded development URLs when configured', () => {
    vi.spyOn(templateRepo, 'isTemplateRepo').mockReturnValue(false);
    vi.spyOn(urls, 'getHardcodedEnvironmentUrls').mockReturnValue(DEVELOPMENT);

    expect(requireEnvironmentUrls('development')).toEqual(DEVELOPMENT);
  });

  it('allows placeholder URLs in the template repo', () => {
    vi.spyOn(templateRepo, 'isTemplateRepo').mockReturnValue(true);
    vi.spyOn(urls, 'getHardcodedEnvironmentUrls').mockReturnValue(urls.PRODUCTION_URLS);

    expect(requireEnvironmentUrls('production')).toEqual(urls.PRODUCTION_URLS);
  });

  it('throws naming urls.ts when placeholders remain outside the template repo', () => {
    vi.spyOn(templateRepo, 'isTemplateRepo').mockReturnValue(false);
    vi.spyOn(urls, 'getHardcodedEnvironmentUrls').mockReturnValue(urls.PRODUCTION_URLS);

    const error = captureError(() => requireEnvironmentUrls('production'));

    expect(error.configPath).toBe('packages/sdk/src/config/urls.ts');
    expect(error.missingFields).toEqual(['production.convexUrl', 'production.webappUrl']);
    expect(error.message).toContain('packages/sdk/src/config/urls.ts');
  });

  it('reports only the missing placeholder fields', () => {
    vi.spyOn(templateRepo, 'isTemplateRepo').mockReturnValue(false);
    vi.spyOn(urls, 'getHardcodedEnvironmentUrls').mockReturnValue({
      convexUrl: PRODUCTION.convexUrl,
      webappUrl: 'https://YOUR_APP.vercel.app',
    });

    const error = captureError(() => requireEnvironmentUrls('production'));

    expect(error.missingFields).toEqual(['production.webappUrl']);
    expect(error.message).toContain('production.webappUrl');
  });

  it('includes setup guidance in the error message', () => {
    vi.spyOn(templateRepo, 'isTemplateRepo').mockReturnValue(false);
    vi.spyOn(urls, 'getHardcodedEnvironmentUrls').mockReturnValue(urls.PRODUCTION_URLS);

    const error = captureError(() => requireEnvironmentUrls('production'));

    expect(error.message).toContain('Update:');
    expect(error.message).toContain('Ask the user for:');
    expect(error.message).toContain('convexUrl');
    expect(error.message).toContain('webappUrl');
    expect(error.message).toContain('pnpm cli auth login --dev');
  });
});
