import { exampleConfigPath } from './paths.js';
import type { CliEnvironment } from './types.js';

export type CliConfigNotSetUpReason = 'missing_file' | 'missing_fields' | 'missing_environment';

function environmentJsonExample(environment: CliEnvironment): string {
  const example =
    environment === 'development'
      ? {
          development: {
            convexUrl: 'https://YOUR_DEV_DEPLOYMENT.convex.cloud',
            webappUrl: 'http://localhost:3000',
          },
        }
      : {
          production: {
            convexUrl: 'https://YOUR_DEPLOYMENT.convex.cloud',
            webappUrl: 'https://YOUR_APP.vercel.app',
          },
        };
  return JSON.stringify(example, null, 2);
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
    const examplePath = exampleConfigPath();
    const envLabel =
      options.environment === 'production' ? 'production (default)' : 'development (--dev)';

    const lines = [
      `CLI is not configured for the ${envLabel} environment.`,
      '',
      `Create or update: ${options.configPath}`,
    ];
    if (examplePath) {
      lines.push(`Copy the template from: ${examplePath}`);
    }
    lines.push('', environmentJsonExample(options.environment));
    if (options.missingFields.length > 0) {
      lines.push('', `Missing field(s): ${options.missingFields.join(', ')}`);
    }
    lines.push(
      '',
      'Ask the user for:',
      '  - convexUrl: the Convex deployment URL (from `npx convex deploy` or the Convex dashboard)',
      '  - webappUrl: the Vercel/production app URL (from the first Vercel deploy)',
      '',
      'Production is the default environment. Use `pnpm cli auth login --dev` to select the development block.'
    );
    return lines.join('\n');
  }
}
