import { describe, expect, it } from 'vitest';

import { stripPnpmSeparator } from './index';

describe('stripPnpmSeparator', () => {
  it('strips a leading `--` separator from pnpm-recursive invocations', () => {
    expect(stripPnpmSeparator(['node', 'bin', '--', 'auth', 'login', '--dev'])).toEqual([
      'node',
      'bin',
      'auth',
      'login',
      '--dev',
    ]);
  });

  it('leaves argv unchanged when there is no leading separator', () => {
    const argv = ['node', 'bin', 'auth', 'login', '--dev'];
    expect(stripPnpmSeparator(argv)).toBe(argv);
  });

  it('leaves a trailing `--` inside a command untouched', () => {
    expect(stripPnpmSeparator(['node', 'bin', 'auth', 'login', '--'])).toEqual([
      'node',
      'bin',
      'auth',
      'login',
      '--',
    ]);
  });
});
