export type EnvironmentUrls = {
  convexUrl: string;
  webappUrl: string;
};

export type CliConfig = {
  production: EnvironmentUrls;
  development?: EnvironmentUrls;
};

export type CliEnvironment = 'production' | 'development';

export type CliCredentials = {
  convexUrl: string;
  sessionId: string;
  webappUrl: string;
};
