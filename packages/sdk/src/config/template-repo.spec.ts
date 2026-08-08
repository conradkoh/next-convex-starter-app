import fs from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { isTemplateRepo } from './template-repo';

const { execSyncMock } = vi.hoisted(() => ({
  execSyncMock: vi.fn(),
}));

vi.mock('node:child_process', () => ({
  execSync: execSyncMock,
}));

let repoDir: string;

beforeEach(() => {
  repoDir = fs.mkdtempSync(join(os.tmpdir(), 'template-repo-'));
  fs.writeFileSync(join(repoDir, 'pnpm-workspace.yaml'), 'packages:\n');
  fs.mkdirSync(join(repoDir, '.git'));
  vi.spyOn(process, 'cwd').mockReturnValue(repoDir);
  execSyncMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(repoDir, { recursive: true, force: true });
});

describe('isTemplateRepo', () => {
  it('returns true when git origin contains the template repo slug', () => {
    execSyncMock.mockReturnValue('https://github.com/conradkoh/next-convex-starter-app.git');

    expect(isTemplateRepo()).toBe(true);
  });

  it('returns false when git origin is a fork', () => {
    execSyncMock.mockReturnValue('https://github.com/acme/my-fork.git');

    expect(isTemplateRepo()).toBe(false);
  });

  it('returns false when there is no .git directory', () => {
    fs.rmSync(join(repoDir, '.git'), { recursive: true, force: true });

    expect(isTemplateRepo()).toBe(false);
    expect(execSyncMock).not.toHaveBeenCalled();
  });

  it('returns false when git remote fails', () => {
    execSyncMock.mockImplementation(() => {
      throw new Error('not a git repository');
    });

    expect(isTemplateRepo()).toBe(false);
  });
});
