import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

/** services/backend/.env.local — the file `convex dev` reads for the development deployment. */
export const backendEnvPath = resolve(
  dirname(import.meta.path),
  '..',
  'services',
  'backend',
  '.env.local'
);

/** A development deployment: the one `convex dev` uses. `deployment` and `url` are not secrets. */
type DevTarget = {
  kind: 'local' | 'hosted-dev';
  deployment?: string;
  url?: string;
};

type EnvInput = {
  /** Process environment. Takes precedence over `envFile`, as the Convex CLI does. */
  env?: Record<string, string | undefined>;
  /** Raw text of services/backend/.env.local. */
  envFile?: string;
};

function readEnvValue(envFile: string, name: string): string | undefined {
  const match = envFile.match(new RegExp(`^\\s*${name}\\s*=\\s*([^#\\r\\n]+?)\\s*(?:#.*)?$`, 'm'));
  return match?.[1]?.trim() || undefined;
}

/** Hostnames that only a local Convex deployment exposes its endpoint on. */
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0']);

/** Convex local deployments expose their endpoint on loopback. */
function isLoopbackUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    return LOOPBACK_HOSTS.has(new URL(url).hostname.toLowerCase());
  } catch {
    return false;
  }
}

/** First non-empty candidate; mirrors the `a || b || c` precedence used for env lookups. */
function firstNonEmpty(...candidates: (string | undefined)[]): string | undefined {
  return candidates.find((candidate) => Boolean(candidate));
}

/** Classify the development deployment `convex dev` uses. Ignores CONVEX_DEPLOY_KEY. */
export function resolveDevTarget({ env = {}, envFile = '' }: EnvInput = {}): DevTarget {
  const deployment = firstNonEmpty(
    env.CONVEX_DEPLOYMENT,
    readEnvValue(envFile, 'CONVEX_DEPLOYMENT')
  );
  const url = firstNonEmpty(
    env.VITE_CONVEX_URL,
    env.CONVEX_URL,
    readEnvValue(envFile, 'VITE_CONVEX_URL'),
    readEnvValue(envFile, 'CONVEX_URL')
  );
  const isLocal = Boolean(deployment?.startsWith('local:')) || isLoopbackUrl(url);
  return { kind: isLocal ? 'local' : 'hosted-dev', deployment, url };
}

export async function readBackendEnvFile(): Promise<string> {
  return readFile(backendEnvPath, 'utf8').catch(() => '');
}
