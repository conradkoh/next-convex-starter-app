import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { findMonorepoRoot } from './paths.js';

const TEMPLATE_REPO_SLUG = 'next-convex-starter-app';

export function isTemplateRepo(): boolean {
  const root = findMonorepoRoot();
  if (!root) {
    return false;
  }
  if (!existsSync(join(root, '.git'))) {
    return false;
  }
  try {
    const origin = execSync('git remote get-url origin', {
      cwd: root,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    return origin.includes(TEMPLATE_REPO_SLUG);
  } catch {
    return false;
  }
}
