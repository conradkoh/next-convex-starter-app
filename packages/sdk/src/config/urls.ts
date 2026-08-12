import type { CliEnvironment, EnvironmentUrls } from './types.js';

/** Update these after your first Convex + Vercel deploy. */
export const PRODUCTION_URLS: EnvironmentUrls = {
  convexUrl: 'https://YOUR_DEPLOYMENT.convex.cloud',
  webappUrl: 'https://YOUR_APP.vercel.app',
};

/** Used by `pnpm cli auth login --dev`. */
export const DEVELOPMENT_URLS: EnvironmentUrls = {
  convexUrl: 'https://YOUR_DEV_DEPLOYMENT.convex.cloud',
  webappUrl: 'http://localhost:3000',
};

const PLACEHOLDER_MARKERS = ['YOUR_DEPLOYMENT', 'YOUR_APP', 'YOUR_DEV_DEPLOYMENT'] as const;

export function isPlaceholderUrl(url: string): boolean {
  return PLACEHOLDER_MARKERS.some((marker) => url.includes(marker));
}

export function getHardcodedEnvironmentUrls(environment: CliEnvironment): EnvironmentUrls {
  return environment === 'production' ? PRODUCTION_URLS : DEVELOPMENT_URLS;
}

/** Relative path shown in error messages. */
export const URLS_SOURCE_PATH = 'packages/sdk/src/config/urls.ts';
