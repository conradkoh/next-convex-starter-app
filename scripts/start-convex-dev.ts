#!/usr/bin/env bun
/**
 * Start Convex dev using the backend version saved for the local deployment.
 *
 * Pinning the version avoids prompting for a local backend upgrade on every
 * startup. A successful upgrade can still update config.json, so the pin
 * follows the deployment's recorded version automatically.
 */

import { appendFile, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { applyConvexDevEnvDefaults } from './convex-dev-env';
import {
  backendEnvPath,
  describeConvexTarget,
  readBackendEnvFile,
  readEnvValue,
  resolveDevTarget,
} from './convex-target';

const repoRoot = resolve(dirname(import.meta.path), '..');
const backendDir = resolve(repoRoot, 'services/backend');
const configPath = resolve(backendDir, '.convex/local/default/config.json');
const backendVersionEnvName = 'CONVEX_LOCAL_BACKEND_VERSION';

type LocalConfig = {
  backendVersion?: unknown;
};

export function buildConvexDevArgs(
  isLocal: boolean,
  backendVersion: string | undefined,
  extraArgs: string[] = []
): string[] {
  const args = ['pnpm', 'exec', 'convex', 'dev'];
  if (isLocal && backendVersion) {
    args.push('--local-backend-version', backendVersion);
  }
  return [...args, ...extraArgs];
}

async function readBackendVersion(): Promise<string> {
  const env = await readBackendEnvFile();
  const envValue = readEnvValue(env, backendVersionEnvName);

  if (envValue) {
    return envValue;
  }

  let config: LocalConfig;

  try {
    config = JSON.parse(await readFile(configPath, 'utf8')) as LocalConfig;
  } catch (error) {
    throw new Error(
      `Could not read local Convex config at ${configPath}. Run Convex setup first.`,
      { cause: error }
    );
  }

  if (typeof config.backendVersion !== 'string' || config.backendVersion.length === 0) {
    throw new Error(`No backendVersion is configured in ${configPath}.`);
  }

  const separator = env.length > 0 && !env.endsWith('\n') ? '\n' : '';
  await appendFile(
    backendEnvPath,
    `${separator}${backendVersionEnvName}=${config.backendVersion}\n`
  );
  console.log(`Saved ${backendVersionEnvName} to ${backendEnvPath}`);
  return config.backendVersion;
}

async function main(): Promise<void> {
  applyConvexDevEnvDefaults();
  const target = resolveDevTarget({ env: process.env, envFile: await readBackendEnvFile() });
  const isLocalDeployment = target.kind === 'local';
  const backendVersion = isLocalDeployment ? await readBackendVersion() : undefined;
  const args = buildConvexDevArgs(isLocalDeployment, backendVersion, process.argv.slice(2));

  console.log(
    `Starting Convex dev for ${describeConvexTarget(target)}${backendVersion ? ` with local backend version ${backendVersion}` : ''}`
  );

  const child = Bun.spawn(args, {
    cwd: backendDir,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });

  process.exit(await child.exited);
}

if (import.meta.main) {
  await main();
}
