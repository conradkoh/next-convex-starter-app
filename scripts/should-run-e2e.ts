#!/usr/bin/env bun
// fallow-ignore-file unused-file

import { TEMPLATE_OWNER_REPO, isTemplateRemote } from './template-repo';

/**
 * Decide whether the template e2e suite should run in the pre-push hook.
 * Used as an `if` condition: exit 0 = run e2e, exit 1 = skip e2e.
 * Only the canonical template repo destination runs it; downstream forks skip.
 */
export function shouldRunE2e(remoteUrl: string | null | undefined): boolean {
  return isTemplateRemote(remoteUrl);
}

/** CLI entry. remoteName is informational only — the URL decides. */
export function runCli(remoteName: string | undefined, remoteUrl: string | undefined): number {
  if (shouldRunE2e(remoteUrl)) {
    console.log(`[pre-push] e2e: pushing to template repo (${TEMPLATE_OWNER_REPO}) — running e2e`);
    return 0;
  }
  console.log(
    `[pre-push] e2e: remote "${remoteName ?? 'unknown'}" is not the template repo — skipping e2e`
  );
  return 1;
}

if (import.meta.main) {
  process.exit(runCli(process.argv[2], process.argv[3]));
}
