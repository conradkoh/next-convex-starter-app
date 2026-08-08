import { Command } from 'commander';

import { registerAuthCommands } from './commands/auth.js';

export function runCli(argv: string[]): void {
  const program = new Command()
    .name('next-convex-starter-app')
    .description('CLI for next-convex-starter-app');

  registerAuthCommands(program);

  program.parse(argv);
}
