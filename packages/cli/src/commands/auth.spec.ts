import { Command } from 'commander';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { registerAuthCommands } from './auth';

vi.mock('@workspace/sdk', () => ({
  CliConfigNotSetUpError: class CliConfigNotSetUpError extends Error {},
  loginWithBrowser: vi.fn(),
  requireEnvironmentUrls: vi.fn(),
  saveCredentials: vi.fn(),
}));

const mocked = await import('@workspace/sdk');

afterEach(() => {
  process.exitCode = 0;
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe('registerAuthCommands', () => {
  it('registers an auth login command with a --dev option', () => {
    const program = new Command();
    registerAuthCommands(program);

    const auth = program.commands.find((cmd) => cmd.name() === 'auth');
    expect(auth).toBeDefined();

    const login = auth?.commands.find((cmd) => cmd.name() === 'login');
    expect(login).toBeDefined();
    expect(login?.description()).toBe('Log in via browser (Google OAuth)');
    expect(login?.options.some((option) => option.long === '--dev')).toBe(true);
  });

  it('prints setup guidance and exits 1 when the CLI config is not set up', async () => {
    vi.mocked(mocked.requireEnvironmentUrls).mockImplementation(() => {
      throw new (mocked.CliConfigNotSetUpError as typeof Error)(
        'CLI is not configured for the production (default) environment.\n...'
      );
    });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const program = new Command();
    registerAuthCommands(program);

    await program.parseAsync(['node', 'bin', 'auth', 'login']);

    expect(process.exitCode).toBe(1);
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('CLI is not configured for the production (default) environment.')
    );
  });

  it('uses production URLs by default and saves credentials on success', async () => {
    const urls = {
      convexUrl: 'https://prod.example.convex.cloud',
      webappUrl: 'https://app.example.vercel.app',
    };
    vi.mocked(mocked.requireEnvironmentUrls).mockReturnValue(urls);
    vi.mocked(mocked.loginWithBrowser).mockResolvedValue({
      success: true,
      sessionId: 'session-1',
      userName: 'Ada',
    });
    vi.mocked(mocked.saveCredentials).mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});

    const program = new Command();
    registerAuthCommands(program);

    await program.parseAsync(['node', 'bin', 'auth', 'login']);

    expect(mocked.requireEnvironmentUrls).toHaveBeenCalledWith('production');
    expect(mocked.loginWithBrowser).toHaveBeenCalledWith({
      ...urls,
      openBrowser: expect.any(Function),
    });
    expect(mocked.saveCredentials).toHaveBeenCalledWith({
      ...urls,
      sessionId: 'session-1',
    });
  });

  it('uses development URLs with the --dev flag', async () => {
    vi.mocked(mocked.requireEnvironmentUrls).mockReturnValue({
      convexUrl: 'https://dev.example.convex.cloud',
      webappUrl: 'http://localhost:3000',
    });
    vi.mocked(mocked.loginWithBrowser).mockResolvedValue({ success: true, sessionId: 'session-1' });
    vi.mocked(mocked.saveCredentials).mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});

    const program = new Command();
    registerAuthCommands(program);

    await program.parseAsync(['node', 'bin', 'auth', 'login', '--dev']);

    expect(mocked.requireEnvironmentUrls).toHaveBeenCalledWith('development');
  });
});
