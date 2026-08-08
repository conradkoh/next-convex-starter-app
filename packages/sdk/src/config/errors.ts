import type { CliEnvironment } from './types.js';
import { DEVELOPMENT_URLS, PRODUCTION_URLS } from './urls.js';

export type CliConfigNotSetUpReason = 'missing_file' | 'missing_fields' | 'missing_environment';

function environmentConstantExample(environment: CliEnvironment): string {
  const urls = environment === 'production' ? PRODUCTION_URLS : DEVELOPMENT_URLS;
  const constantName = environment === 'production' ? 'PRODUCTION_URLS' : 'DEVELOPMENT_URLS';
  return `export const ${constantName} = ${JSON.stringify(urls, null, 2)};`;
}

export class CliConfigNotSetUpError extends Error {
  readonly configPath: string;
  readonly environment: CliEnvironment;
  readonly missingFields: string[];

  constructor(options: {
    configPath: string;
    environment: CliEnvironment;
    missingFields: string[];
    reason: CliConfigNotSetUpReason;
  }) {
    super(CliConfigNotSetUpError.formatHelp(options));
    this.name = 'CliConfigNotSetUpError';
    this.configPath = options.configPath;
    this.environment = options.environment;
    this.missingFields = options.missingFields;
  }

  static formatHelp(options: {
    configPath: string;
    environment: CliEnvironment;
    missingFields: string[];
    reason: CliConfigNotSetUpReason;
  }): string {
    const envLabel =
      options.environment === 'production' ? 'production (default)' : 'development (--dev)';

    const lines = [
      `CLI is not configured for the ${envLabel} environment.`,
      '',
      `Update: ${options.configPath}`,
      '',
      environmentConstantExample(options.environment),
    ];
    if (options.missingFields.length > 0) {
      lines.push('', `Missing field(s): ${options.missingFields.join(', ')}`);
    }
    lines.push(
      '',
      'Ask the user for:',
      '  - convexUrl: the Convex deployment URL (from `npx convex deploy` or the Convex dashboard)',
      '  - webappUrl: the Vercel/production app URL (from the first Vercel deploy)',
      '',
      'Then edit the matching constant in packages/sdk/src/config/urls.ts.',
      '',
      'Production is the default environment. Use `pnpm cli auth login --dev` for development URLs.'
    );
    return lines.join('\n');
  }
}
