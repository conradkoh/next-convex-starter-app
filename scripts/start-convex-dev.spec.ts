import { describe, expect, it } from 'bun:test';

import { buildConvexDevArgs } from './start-convex-dev';

describe('Convex dev command selection', () => {
  it('pins the backend version only for local deployments', () => {
    expect(buildConvexDevArgs(true, 'precompiled-test')).toEqual([
      'pnpm',
      'exec',
      'convex',
      'dev',
      '--local-backend-version',
      'precompiled-test',
    ]);
    expect(buildConvexDevArgs(false, 'precompiled-test')).toEqual([
      'pnpm',
      'exec',
      'convex',
      'dev',
    ]);
  });
});
