import {
  loginWithBrowser,
  resolveConvexUrl,
  resolveWebappUrl,
  saveCredentials,
} from '@workspace/sdk';
import type { Command } from 'commander';
import open from 'open';

export function registerAuthCommands(program: Command): void {
  const auth = program.command('auth').description('Authentication commands');

  auth
    .command('login')
    .description('Log in via browser (Google OAuth)')
    .action(async () => {
      const convexUrl = resolveConvexUrl();
      const webappUrl = resolveWebappUrl();

      console.log('Opening browser to log in...');
      const result = await loginWithBrowser({
        convexUrl,
        webappUrl,
        openBrowser: async (url: string) => {
          await open(url);
        },
      });

      if (!result.success) {
        console.error(`Login failed: ${result.error}`);
        process.exitCode = 1;
        return;
      }

      saveCredentials({ convexUrl, sessionId: result.sessionId, webappUrl });
      console.log(
        result.userName ? `Logged in as ${result.userName}` : 'Login successful. Credentials saved.'
      );
    });
}
