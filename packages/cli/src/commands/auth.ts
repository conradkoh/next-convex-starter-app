import {
  CliConfigNotSetUpError,
  loginWithBrowser,
  requireEnvironmentUrls,
  saveCredentials,
} from '@workspace/sdk';
import type { Command } from 'commander';
import open from 'open';

export function registerAuthCommands(program: Command): void {
  const auth = program.command('auth').description('Authentication commands');

  auth
    .command('login')
    .description('Log in via browser (Google OAuth)')
    .option('--dev', 'Use development URLs from cli.config.json instead of production')
    .action(runAuthLogin);
}

// fallow-ignore-next-line complexity
async function runAuthLogin(options: { dev?: boolean }): Promise<void> {
  const environment = options.dev ? 'development' : 'production';

  let urls: { convexUrl: string; webappUrl: string };
  try {
    urls = requireEnvironmentUrls(environment);
  } catch (error) {
    if (error instanceof CliConfigNotSetUpError) {
      console.error(error.message);
      process.exitCode = 1;
      return;
    }
    throw error;
  }

  console.log(`Opening browser to log in (${environment})...`);
  const result = await loginWithBrowser({
    ...urls,
    openBrowser: async (url: string) => {
      await open(url);
    },
  });

  if (!result.success) {
    console.error(`Login failed: ${result.error}`);
    process.exitCode = 1;
    return;
  }

  saveCredentials({ ...urls, sessionId: result.sessionId });
  console.log(
    result.userName ? `Logged in as ${result.userName}` : 'Login successful. Credentials saved.'
  );
}
