import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { credentialsPath, webappEnvPath } from './paths.js';
import type { CliCredentials } from './types.js';

/**
 * Parses `.env`-style content into a key/value map. Mirrors the parser in
 * `apps/webapp/tests/e2e/support/env.ts`.
 */
// fallow-ignore-next-line complexity
function parseEnvContent(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || trimmed === '') {
      continue;
    }
    const withoutExport = trimmed.startsWith('export ') ? trimmed.slice(7) : trimmed;
    const eqIndex = withoutExport.indexOf('=');
    if (eqIndex === -1) {
      continue;
    }
    const key = withoutExport.slice(0, eqIndex).trim();
    let value = withoutExport.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

function readEnvFile(envPath: string | null): Record<string, string> {
  if (!envPath || !existsSync(envPath)) {
    return {};
  }
  try {
    return parseEnvContent(readFileSync(envPath, 'utf-8'));
  } catch {
    return {};
  }
}

function readWebappEnvValue(key: string): string | undefined {
  return readEnvFile(webappEnvPath())[key];
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

export function resolveConvexUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  const fromFile = readWebappEnvValue('NEXT_PUBLIC_CONVEX_URL')?.trim();
  if (fromFile) {
    return fromFile;
  }
  throw new Error(
    'NEXT_PUBLIC_CONVEX_URL not found. Set it in apps/webapp/.env.local or via the environment.'
  );
}

export function resolveWebappUrl(): string {
  const fromEnv = process.env.WEBAPP_URL?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  const port = readWebappEnvValue('PORT')?.trim();
  return `http://localhost:${port || '3000'}`;
}
