import { existsSync, readFileSync } from 'node:fs';
import os from 'node:os';
import { dirname, join } from 'node:path';

import { PACKAGE_NAME } from '../constants.js';

/**
 * Walks up from a starting directory to find the monorepo root (the directory
 * containing `pnpm-workspace.yaml`).
 */
export function findMonorepoRoot(startDir: string = process.cwd()): string | null {
  let dir = startDir;
  for (;;) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return null;
    }
    dir = parent;
  }
}

/**
 * Reads the package name from the root `package.json` at runtime so rebranded
 * forks stay in sync, falling back to the template default.
 */
function readRootPackageName(): string {
  const root = findMonorepoRoot();
  if (root) {
    try {
      const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { name?: string };
      if (pkg.name) {
        return pkg.name;
      }
    } catch {
      // Fall back to the template default below.
    }
  }
  return PACKAGE_NAME;
}

/** Resolves `~/.config/{packageName}/credentials.json`. */
export function credentialsPath(): string {
  return join(os.homedir(), '.config', readRootPackageName(), 'credentials.json');
}
