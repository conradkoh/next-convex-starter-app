import { describe, expect, it } from 'vitest';

import { CliConfigNotSetUpError } from './errors';

const OPTIONS = {
  configPath: '/path/to/cli.config.json',
  environment: 'production' as const,
  missingFields: ['production.convexUrl', 'production.webappUrl'],
  reason: 'missing_file' as const,
};

describe('CliConfigNotSetUpError', () => {
  it('is an Error named CliConfigNotSetUpError', () => {
    const error = new CliConfigNotSetUpError(OPTIONS);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('CliConfigNotSetUpError');
    expect(error.configPath).toBe('/path/to/cli.config.json');
    expect(error.environment).toBe('production');
    expect(error.missingFields).toEqual(['production.convexUrl', 'production.webappUrl']);
  });

  it('labels the production environment as default', () => {
    const message = CliConfigNotSetUpError.formatHelp(OPTIONS);

    expect(message).toContain('production (default)');
  });

  it('labels the development environment with --dev', () => {
    const message = CliConfigNotSetUpError.formatHelp({
      ...OPTIONS,
      environment: 'development',
      missingFields: ['development.convexUrl', 'development.webappUrl'],
      reason: 'missing_environment',
    });

    expect(message).toContain('development (--dev)');
    expect(message).toContain('"development"');
  });

  it('includes the config path, example reference, JSON shape, and guidance', () => {
    const message = CliConfigNotSetUpError.formatHelp(OPTIONS);

    expect(message).toContain('/path/to/cli.config.json');
    expect(message).toContain('cli.config.example.json');
    expect(message).toContain('"convexUrl"');
    expect(message).toContain('"webappUrl"');
    expect(message).toContain('Ask the user for:');
    expect(message).toContain('production.convexUrl');
    expect(message).toContain('pnpm cli auth login --dev');
  });

  it('omits the missing-fields line when there are none', () => {
    const message = CliConfigNotSetUpError.formatHelp({
      ...OPTIONS,
      missingFields: [],
    });

    expect(message).not.toContain('Missing field(s)');
  });
});
