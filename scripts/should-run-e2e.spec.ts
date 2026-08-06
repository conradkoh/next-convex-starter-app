import { describe, expect, it } from 'bun:test';

import { runCli, shouldRunE2e } from './should-run-e2e';
import { TEMPLATE_REPO_URL } from './template-repo';

describe('shouldRunE2e', () => {
  it('runs for template HTTPS (with and without .git)', () => {
    expect(shouldRunE2e('https://github.com/conradkoh/next-convex-starter-app')).toBe(true);
    expect(shouldRunE2e('https://github.com/conradkoh/next-convex-starter-app.git')).toBe(true);
  });

  it('runs for template SSH forms', () => {
    expect(shouldRunE2e('git@github.com:conradkoh/next-convex-starter-app.git')).toBe(true);
    expect(shouldRunE2e('ssh://git@github.com/conradkoh/next-convex-starter-app.git')).toBe(true);
  });

  it('skips forks, lookalike hosts, and unknown URLs (fail closed)', () => {
    expect(shouldRunE2e('https://github.com/someone-else/next-convex-starter-app.git')).toBe(false);
    expect(shouldRunE2e('https://evilgithub.com/conradkoh/next-convex-starter-app.git')).toBe(
      false
    );
    expect(shouldRunE2e('https://github.com/conradkoh/next-convex-starter-app/extra')).toBe(false);
    expect(shouldRunE2e('')).toBe(false);
    expect(shouldRunE2e(null)).toBe(false);
    expect(shouldRunE2e(undefined)).toBe(false);
    expect(shouldRunE2e('https://gitlab.com/conradkoh/next-convex-starter-app.git')).toBe(false);
    expect(shouldRunE2e('/local/path/to/repo')).toBe(false);
  });
});

describe('runCli (URL decides, not remote name)', () => {
  it('returns 0 for the template repo URL regardless of remote name', () => {
    expect(runCli('origin', TEMPLATE_REPO_URL)).toBe(0);
    expect(runCli('upstream', `${TEMPLATE_REPO_URL}.git`)).toBe(0);
  });

  it('returns 1 for a fork URL even when remote name is origin', () => {
    expect(runCli('origin', 'https://github.com/someone-else/next-convex-starter-app.git')).toBe(1);
  });

  it('returns 1 when the URL is empty', () => {
    expect(runCli('origin', '')).toBe(1);
  });
});

describe('CLI entrypoint (verifies import.meta.main + argv[3] consumed as URL)', () => {
  const repoRoot = new URL('..', import.meta.url).pathname;

  it('exits 0 when argv[3] is the template repo URL', () => {
    const proc = Bun.spawnSync(['bun', 'scripts/should-run-e2e.ts', 'origin', TEMPLATE_REPO_URL], {
      cwd: repoRoot,
    });
    expect(proc.exitCode).toBe(0);
  });

  it('exits 1 when argv[3] is a fork URL', () => {
    const proc = Bun.spawnSync(
      [
        'bun',
        'scripts/should-run-e2e.ts',
        'origin',
        'https://github.com/someone-else/next-convex-starter-app.git',
      ],
      { cwd: repoRoot }
    );
    expect(proc.exitCode).toBe(1);
  });
});

describe('pre-push hook contract', () => {
  it('wires the destination URL through the conditional and gates only e2e', async () => {
    const hook = await Bun.file(new URL('../.husky/pre-push', import.meta.url)).text();
    // Uses the URL ($2), not the name ($1)
    expect(hook).toContain('if bun scripts/should-run-e2e.ts "$1" "$2"; then');
    // Correct branch ordering: run e2e on success, skip on failure
    expect(hook).toMatch(/then\s*\n\s*pnpm run e2e\s*\n\s*else/s);
    // Only the e2e command is conditional; other checks stay unconditional
    expect(hook).toContain('pnpm run test');
    expect(hook).toContain('bun run test:scripts');
    expect(hook).toContain('pnpm run typecheck');
    expect(hook.match(/if bun scripts\/should-run-e2e\.ts/g)).toHaveLength(1);
  });
});
