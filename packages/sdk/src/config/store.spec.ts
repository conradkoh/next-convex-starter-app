import fs from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CliConfigNotSetUpError } from './errors';
import { requireEnvironmentUrls } from './store';
import type { EnvironmentUrls } from './types';

const PRODUCTION: EnvironmentUrls = {
  convexUrl: 'https://prod.example.convex.cloud',
  webappUrl: 'https://app.example.vercel.app',
};
const DEVELOPMENT: EnvironmentUrls = {
  convexUrl: 'https://dev.example.convex.cloud',
  webappUrl: 'http://localhost:3000',
};

let repoDir: string;
let nonRepoDir: string;
let homeDir: string;

function globalConfigPath(): string {
  return join(homeDir, '.config', 'next-convex-starter-app', 'config.json');
}

function writeRepoConfig(config: unknown): void {
  fs.writeFileSync(join(repoDir, 'cli.config.json'), JSON.stringify(config, null, 2));
}

function writeGlobalConfig(config: unknown): void {
  fs.mkdirSync(join(homeDir, '.config', 'next-convex-starter-app'), { recursive: true });
  fs.writeFileSync(globalConfigPath(), JSON.stringify(config, null, 2));
}

function useRepoCwd(): void {
  vi.spyOn(process, 'cwd').mockReturnValue(repoDir);
  vi.spyOn(os, 'homedir').mockReturnValue(homeDir);
}

function useNonRepoCwd(): void {
  vi.spyOn(process, 'cwd').mockReturnValue(nonRepoDir);
  vi.spyOn(os, 'homedir').mockReturnValue(homeDir);
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
  repoDir = fs.mkdtempSync(join(os.tmpdir(), 'cli-config-repo-'));
  nonRepoDir = fs.mkdtempSync(join(os.tmpdir(), 'cli-config-nonrepo-'));
  homeDir = fs.mkdtempSync(join(os.tmpdir(), 'cli-config-home-'));
  fs.writeFileSync(join(repoDir, 'pnpm-workspace.yaml'), 'packages:\n');
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  fs.rmSync(repoDir, { recursive: true, force: true });
  fs.rmSync(nonRepoDir, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

describe('requireEnvironmentUrls', () => {
  it('throws a config error naming the repo config path when no file exists', () => {
    useRepoCwd();

    const error = captureError(() => requireEnvironmentUrls('production'));

    expect(error.configPath).toBe(join(repoDir, 'cli.config.json'));
    expect(error.missingFields).toEqual(['production.convexUrl', 'production.webappUrl']);
    expect(error.message).toContain(join(repoDir, 'cli.config.json'));
  });

  it('resolves production URLs by default from the repo config', () => {
    useRepoCwd();
    writeRepoConfig({ production: PRODUCTION });

    expect(requireEnvironmentUrls('production')).toEqual(PRODUCTION);
  });

  it('resolves development URLs when the development block is present', () => {
    useRepoCwd();
    writeRepoConfig({ production: PRODUCTION, development: DEVELOPMENT });

    expect(requireEnvironmentUrls('development')).toEqual(DEVELOPMENT);
  });

  it('errors clearly when the development block is missing', () => {
    useRepoCwd();
    writeRepoConfig({ production: PRODUCTION });

    const error = captureError(() => requireEnvironmentUrls('development'));

    expect(error.missingFields).toEqual(['development.convexUrl', 'development.webappUrl']);
    expect(error.message).toContain('development');
  });

  it('reports missing fields within a present block', () => {
    useRepoCwd();
    writeRepoConfig({ production: { convexUrl: PRODUCTION.convexUrl } });

    const error = captureError(() => requireEnvironmentUrls('production'));

    expect(error.missingFields).toEqual(['production.webappUrl']);
    expect(error.message).toContain('production.webappUrl');
  });

  it('falls back to the global config outside a monorepo', () => {
    useNonRepoCwd();
    writeGlobalConfig({ production: PRODUCTION });

    expect(requireEnvironmentUrls('production')).toEqual(PRODUCTION);
  });

  it('prefers the repo config over the global config', () => {
    useRepoCwd();
    writeRepoConfig({ production: PRODUCTION });
    writeGlobalConfig({
      production: { convexUrl: 'https://wrong.convex.cloud', webappUrl: 'https://wrong.app' },
    });

    expect(requireEnvironmentUrls('production')).toEqual(PRODUCTION);
  });

  it('throws naming the global config path when outside a monorepo with no config', () => {
    useNonRepoCwd();

    const error = captureError(() => requireEnvironmentUrls('production'));

    expect(error.configPath).toBe(globalConfigPath());
    expect(error.message).toContain(globalConfigPath());
  });

  it('includes copy-pasteable setup guidance in the error message', () => {
    useRepoCwd();

    const error = captureError(() => requireEnvironmentUrls('production'));

    expect(error.message).toContain('Create or update:');
    expect(error.message).toContain('cli.config.example.json');
    expect(error.message).toContain('Ask the user for:');
    expect(error.message).toContain('convexUrl');
    expect(error.message).toContain('webappUrl');
    expect(error.message).toContain('pnpm cli auth login --dev');
  });
});
