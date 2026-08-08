import fs from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CliConfigNotSetUpError } from './errors';
import { loadCredentials, requireEnvironmentUrls, saveCredentials } from './store';
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

let homeDir: string;

function authJsoncPath(): string {
  return join(homeDir, '.next-convex-starter-app', 'auth.jsonc');
}

function captureError(fn: () => unknown): CliConfigNotSetUpError {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(CliConfigNotSetUpError);
    return error as CliConfigNotSetUpError;
  }
  throw new Error('Expected requireEnvironmentUrls to throw');
}

beforeEach(() => {
  homeDir = fs.mkdtempSync(join(os.tmpdir(), 'cli-config-home-'));
  vi.spyOn(os, 'homedir').mockReturnValue(homeDir);
});

afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(homeDir, { recursive: true, force: true });
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

describe('credentials', () => {
  it('saves credentials to ~/.appname/auth.jsonc with mode 0600', () => {
    saveCredentials({
      convexUrl: PRODUCTION.convexUrl,
      webappUrl: PRODUCTION.webappUrl,
      sessionId: 'session-1',
    });

    const filePath = authJsoncPath();
    expect(fs.existsSync(filePath)).toBe(true);
    const stat = fs.statSync(filePath);
    expect(stat.mode & 0o777).toBe(0o600);
    expect(JSON.parse(fs.readFileSync(filePath, 'utf-8'))).toEqual({
      convexUrl: PRODUCTION.convexUrl,
      webappUrl: PRODUCTION.webappUrl,
      sessionId: 'session-1',
    });
  });

  it('loads credentials from ~/.appname/auth.jsonc', () => {
    const dir = join(homeDir, '.next-convex-starter-app');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      authJsoncPath(),
      JSON.stringify({
        convexUrl: PRODUCTION.convexUrl,
        webappUrl: PRODUCTION.webappUrl,
        sessionId: 'session-1',
      })
    );

    expect(loadCredentials()).toEqual({
      convexUrl: PRODUCTION.convexUrl,
      webappUrl: PRODUCTION.webappUrl,
      sessionId: 'session-1',
    });
  });
});
