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

/**
 * The development deployment `convex dev` uses, or a state that must never be migrated.
 * `deployment` and `url` are not secrets.
 */
export type DevTarget =
  | { kind: 'local'; deployment?: string; url?: string }
  | { kind: 'hosted-dev'; deployment?: string; url?: string }
  /** CONVEX_DEPLOYMENT selects production but CONVEX_DEPLOY_KEY is not set. */
  | { kind: 'prod-without-key'; deployment: string }
  /** No usable CONVEX_DEPLOYMENT selector and no CONVEX_URL / VITE_CONVEX_URL. */
  | { kind: 'unconfigured' };

type EnvInput = {
  /** Process environment. Takes precedence over `envFile`, as the Convex CLI does. */
  env?: Record<string, string | undefined>;
  /** Raw text of services/backend/.env.local. */
  envFile?: string;
};

/** `NAME=rest-of-line`, optional `export ` prefix. Matches one line only. */
const ENV_ASSIGNMENT = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/;

/**
 * Value of `name` in dotenv-style text (first assignment wins). Single line only:
 * an empty `NAME=` is undefined, never the next line.
 */
export function readEnvValue(envFile: string, name: string): string | undefined {
  for (const line of envFile.split(/\r?\n/)) {
    const match = ENV_ASSIGNMENT.exec(line);
    if (!match) continue;
    if (match[1] !== name) continue;
    return parseEnvValue(match[2]);
  }
  return undefined;
}

/** Quoted: text between matching quotes (rest ignored). Unquoted: text before an inline ` #` comment. */
function parseEnvValue(rawValue: string): string | undefined {
  const value = rawValue.trim();
  const quote = value.charAt(0);
  if (quote === '"' || quote === "'") return unquote(value, quote);
  return stripInlineComment(value);
}

function unquote(value: string, quote: string): string | undefined {
  const closing = value.indexOf(quote, 1);
  if (closing === -1) return undefined;
  return value.slice(1, closing).trim() || undefined;
}

function stripInlineComment(value: string): string | undefined {
  return value.replace(/(^|\s)#.*$/, '').trim() || undefined;
}

/** Hostnames that only a local Convex deployment exposes its endpoint on. */
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0']);

function isLoopbackUrl(url: string): boolean {
  try {
    return LOOPBACK_HOSTS.has(new URL(url).hostname.toLowerCase());
  } catch {
    return false;
  }
}

/** First non-empty candidate. */
function firstNonEmpty(...candidates: (string | undefined)[]): string | undefined {
  return candidates.find((candidate) => Boolean(candidate));
}

/** An explicit selector is authoritative. The URL is not consulted here. */
function targetFromSelector(deployment: string, url: string | undefined): DevTarget {
  if (deployment.startsWith('prod:')) return { kind: 'prod-without-key', deployment };
  const devKind = devKindFromSelector(deployment);
  return devKind ? { kind: devKind, deployment, url } : { kind: 'unconfigured' };
}

/** `local:` and `anonymous:` are local deployments; `dev:` is hosted. */
function devKindFromSelector(deployment: string): 'local' | 'hosted-dev' | undefined {
  if (deployment.startsWith('local:') || deployment.startsWith('anonymous:')) return 'local';
  if (deployment.startsWith('dev:')) return 'hosted-dev';
  return undefined;
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
  if (deployment) return targetFromSelector(deployment, url);
  if (url) return { kind: isLoopbackUrl(url) ? 'local' : 'hosted-dev', url };
  return { kind: 'unconfigured' };
}

export async function readBackendEnvFile(): Promise<string> {
  return readFile(backendEnvPath, 'utf8').catch(() => '');
}

/** What a migration run targets: production (CI, deploy key set) or the development deployment. */
export type ConvexTarget = { kind: 'production' } | DevTarget;

type ConvexTargetInput = EnvInput & {
  /** CONVEX_DEPLOY_KEY. When set (non-empty) the target is production. */
  deployKey?: string;
};

/**
 * Target for `pnpm migrate`. Production iff a deploy key is set (CI); otherwise the
 * development deployment `convex dev` uses. The deploy key is never used to classify dev.
 */
export function resolveConvexTarget({ deployKey, ...input }: ConvexTargetInput = {}): ConvexTarget {
  return deployKey ? { kind: 'production' } : resolveDevTarget(input);
}

/** Why migrations must not run against this target, or undefined when they may run. */
export function unrunnableReason(target: ConvexTarget): string | undefined {
  switch (target.kind) {
    case 'prod-without-key':
      return `CONVEX_DEPLOYMENT=${target.deployment} selects PRODUCTION, but CONVEX_DEPLOY_KEY is not set. Nothing was run. To migrate production, run with CONVEX_DEPLOY_KEY set (CI). To migrate development, point CONVEX_DEPLOYMENT in services/backend/.env.local at a dev: or local: deployment.`;
    case 'unconfigured':
      return 'No development deployment is configured. Nothing was run. Run `npx convex dev` in services/backend once to configure a deployment, or set CONVEX_DEPLOY_KEY to target production.';
    default:
      return undefined;
  }
}

/**
 * Arguments for `npx convex <args>`. `--prod` only for production. Without it the Convex CLI
 * resolves the development deployment from services/backend/.env.local, as `convex dev` does.
 * Throws for targets that must not run (see `unrunnableReason`).
 */
export function buildConvexRunArgs(target: ConvexTarget, functionName: string): string[] {
  const reason = unrunnableReason(target);
  if (reason) throw new Error(reason);
  return target.kind === 'production' ? ['run', functionName, '--prod'] : ['run', functionName];
}

const PRODUCTION_LABEL = 'PRODUCTION deployment (CONVEX_DEPLOY_KEY is set)';
const UNCONFIGURED_LABEL =
  'UNCONFIGURED: no usable CONVEX_DEPLOYMENT or CONVEX_URL in the environment or services/backend/.env.local';

/**
 * Human-readable migration target. Contains deployment name and URL only, never keys.
 * Split into small helpers so each stays simple and the strings stay exhaustive.
 */
export function describeConvexTarget(target: ConvexTarget): string {
  if (target.kind === 'prod-without-key') return describeProdWithoutKey(target.deployment);
  if (target.kind === 'unconfigured') return UNCONFIGURED_LABEL;
  return describeRunnableTarget(target);
}

function describeRunnableTarget(
  target: Extract<ConvexTarget, { kind: 'production' | 'local' | 'hosted-dev' }>
): string {
  if (target.kind === 'production') return PRODUCTION_LABEL;
  return describeDevelopmentTarget(target);
}

function describeDevelopmentTarget(
  target: Extract<DevTarget, { kind: 'local' | 'hosted-dev' }>
): string {
  if (target.kind === 'local') return describeLocalTarget(target.deployment);
  return describeHostedDevTarget(target.deployment, target.url);
}

function describeLocalTarget(deployment: string | undefined): string {
  return deployment ? `LOCAL development server (${deployment})` : 'LOCAL development server';
}

function describeHostedDevTarget(deployment: string | undefined, url: string | undefined): string {
  const name = deployment
    ? `HOSTED development deployment ${deployment}`
    : 'HOSTED development deployment';
  return url ? `${name} at ${url}` : name;
}

function describeProdWithoutKey(deployment: string): string {
  return `PRODUCTION deployment ${deployment} selected by CONVEX_DEPLOYMENT; CONVEX_DEPLOY_KEY is not set`;
}
