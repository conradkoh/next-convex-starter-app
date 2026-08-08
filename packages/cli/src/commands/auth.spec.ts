import { Command } from 'commander';
import { describe, expect, it, vi } from 'vitest';

import { registerAuthCommands } from './auth';

vi.mock('@workspace/sdk', () => ({
  loginWithBrowser: vi.fn(),
  resolveConvexUrl: vi.fn(),
  resolveWebappUrl: vi.fn(),
  saveCredentials: vi.fn(),
}));

describe('registerAuthCommands', () => {
  it('registers an auth login command', () => {
    const program = new Command();
    registerAuthCommands(program);

    const auth = program.commands.find((cmd) => cmd.name() === 'auth');
    expect(auth).toBeDefined();

    const login = auth?.commands.find((cmd) => cmd.name() === 'login');
    expect(login).toBeDefined();
    expect(login?.description()).toBe('Log in via browser (Google OAuth)');
  });
});
