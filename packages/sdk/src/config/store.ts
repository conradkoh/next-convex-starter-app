import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { CliConfigNotSetUpError } from './errors.js';
import { credentialsPath } from './paths.js';
import { isTemplateRepo } from './template-repo.js';
import type { CliCredentials, CliEnvironment, EnvironmentUrls } from './types.js';
import { getHardcodedEnvironmentUrls, isPlaceholderUrl, URLS_SOURCE_PATH } from './urls.js';

// fallow-ignore-next-line complexity
export function requireEnvironmentUrls(environment: CliEnvironment): EnvironmentUrls {
  const urls = getHardcodedEnvironmentUrls(environment);

  if (isTemplateRepo()) {
    return urls;
  }

  const missing: string[] = [];
  if (isPlaceholderUrl(urls.convexUrl)) {
    missing.push(`${environment}.convexUrl`);
  }
  if (isPlaceholderUrl(urls.webappUrl)) {
    missing.push(`${environment}.webappUrl`);
  }

  if (missing.length > 0) {
    throw new CliConfigNotSetUpError({
      configPath: URLS_SOURCE_PATH,
      environment,
      missingFields: missing,
      reason: 'missing_fields',
    });
  }

  return urls;
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
