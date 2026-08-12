import { Command } from 'commander';

import { registerAuthCommands } from './commands/auth.js';

/**
 * Drops the leading `--` separator that `pnpm --filter ... run start -- <args>`
 * injects, which commander would otherwise treat as "end of options" and turn
 * flags like `--dev` into positional arguments.
 */
// fallow-ignore-next-line unused-export
export function stripPnpmSeparator(argv: string[]): string[] {
  return argv[2] === '--' ? [...argv.slice(0, 2), ...argv.slice(3)] : argv;
}

export function runCli(argv: string[]): void {
  const program = new Command()
    .name('next-convex-starter-app')
    .description('CLI for next-convex-starter-app');

  registerAuthCommands(program);

  program.parse(stripPnpmSeparator(argv));
}
