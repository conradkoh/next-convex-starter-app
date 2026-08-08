import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { CliConfigNotSetUpError } from './errors.js';
import { credentialsPath, globalConfigPath, preferredConfigPath, repoConfigPath } from './paths.js';
import type { CliConfig, CliCredentials, CliEnvironment, EnvironmentUrls } from './types.js';

function loadConfigFile(path: string): CliConfig | null {
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf-8')) as Partial<CliConfig>;
    if (!parsed.production) {
      return null;
    }
    return {
      production: parsed.production,
      ...(parsed.development ? { development: parsed.development } : {}),
    };
  } catch {
    return null;
  }
}

export function loadCliConfig(): CliConfig | null {
  const repoPath = repoConfigPath();
  if (repoPath && existsSync(repoPath)) {
    return loadConfigFile(repoPath);
  }
  const globalPath = globalConfigPath();
  if (existsSync(globalPath)) {
    return loadConfigFile(globalPath);
  }
  return null;
}

function validateEnvironmentUrls(
  urls: Partial<EnvironmentUrls> | undefined,
  prefix: string
): string[] {
  const missing: string[] = [];
  if (!urls?.convexUrl?.trim()) {
    missing.push(`${prefix}.convexUrl`);
  }
  if (!urls?.webappUrl?.trim()) {
    missing.push(`${prefix}.webappUrl`);
  }
  return missing;
}

// fallow-ignore-next-line complexity
export function requireEnvironmentUrls(environment: CliEnvironment): EnvironmentUrls {
  const configPath = preferredConfigPath();
  const config = loadCliConfig();

  if (!config) {
    throw new CliConfigNotSetUpError({
      configPath,
      environment,
      missingFields: [`${environment}.convexUrl`, `${environment}.webappUrl`],
      reason: 'missing_file',
    });
  }

  const urls = environment === 'production' ? config.production : config.development;
  const missing = validateEnvironmentUrls(urls, environment);

  if (environment === 'development' && !urls) {
    throw new CliConfigNotSetUpError({
      configPath,
      environment,
      missingFields: ['development.convexUrl', 'development.webappUrl'],
      reason: 'missing_environment',
    });
  }

  if (missing.length > 0) {
    throw new CliConfigNotSetUpError({
      configPath,
      environment,
      missingFields: missing,
      reason: 'missing_fields',
    });
  }

  return urls as EnvironmentUrls;
}

// fallow-ignore-next-line complexity
export function loadCredentials(): CliCredentials | null {
  const filePath = credentialsPath();
  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf-8')) as Partial<CliCredentials>;
    if (!parsed.convexUrl || !parsed.sessionId || !parsed.webappUrl) {
      return null;
    }
    return {
      convexUrl: parsed.convexUrl,
      sessionId: parsed.sessionId,
      webappUrl: parsed.webappUrl,
    };
  } catch {
    return null;
  }
}

export function saveCredentials(credentials: CliCredentials): void {
  const filePath = credentialsPath();
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(credentials, null, 2)}\n`, { mode: 0o600 });
}
