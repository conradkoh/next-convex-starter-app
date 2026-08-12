import { randomUUID } from 'node:crypto';

import { api } from '@workspace/backend/convex/_generated/api.js';
import type { Doc, Id } from '@workspace/backend/convex/_generated/dataModel.js';
import { ConvexHttpClient } from 'convex/browser';
import type { SessionId } from 'convex-helpers/server/sessions';

import { buildGoogleOAuthUrl, createOAuthState } from './oauth.js';

export type LoginOptions = {
  convexUrl: string;
  webappUrl: string;
  openBrowser?: (url: string) => Promise<void>;
  pollIntervalMs?: number;
  timeoutMs?: number;
};

export type LoginResult =
  { success: true; sessionId: SessionId; userName?: string } | { success: false; error: string };

export type LoginDeps = {
  /** Test seam — overrides the default ConvexHttpClient construction. */
  createClient?: (convexUrl: string) => ConvexHttpClient;
};

const DEFAULT_POLL_INTERVAL_MS = 2000;
const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const defaultOpenBrowser: (url: string) => Promise<void> = async (url) => {
  const { default: open } = await import('open');
  await open(url);
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// fallow-ignore-next-line complexity
export async function loginWithBrowser(
  options: LoginOptions,
  deps: LoginDeps = {}
): Promise<LoginResult> {
  const {
    convexUrl,
    webappUrl,
    openBrowser = defaultOpenBrowser,
    pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options;
  const createClient = deps.createClient ?? ((url: string) => new ConvexHttpClient(url));

  const sessionId = randomUUID() as SessionId;
  const client = createClient(convexUrl);
  const redirectUri = `${webappUrl}/api/auth/google/callback`;

  let loginId: Id<'auth_loginRequests'>;
  try {
    const created = await client.mutation(api.auth.google.createLoginRequest, {
      sessionId,
      redirectUri,
    });
    loginId = created.loginId;
  } catch (error) {
    return { success: false, error: `Failed to start login: ${errorMessage(error)}` };
  }

  let clientId: string;
  try {
    const config = await client.query(api.auth.google.getConfig, {});
    if (!config.enabled || !config.clientId) {
      return { success: false, error: 'Google authentication is disabled or not configured.' };
    }
    clientId = config.clientId;
  } catch (error) {
    return { success: false, error: `Failed to read auth config: ${errorMessage(error)}` };
  }

  const authUrl = buildGoogleOAuthUrl({
    clientId,
    redirectUri,
    state: createOAuthState('login', loginId),
  });
  try {
    await openBrowser(authUrl);
  } catch (error) {
    return { success: false, error: `Failed to open browser: ${errorMessage(error)}` };
  }

  const startedAt = Date.now();
  for (;;) {
    if (Date.now() - startedAt > timeoutMs) {
      return { success: false, error: 'Login timed out. Please try again.' };
    }

    let loginRequest: Doc<'auth_loginRequests'> | null = null;
    try {
      loginRequest = await client.query(api.auth.google.getLoginRequest, {
        loginRequestId: loginId,
      });
    } catch (error) {
      return { success: false, error: `Failed to poll login request: ${errorMessage(error)}` };
    }

    if (loginRequest?.status === 'completed') {
      try {
        const authState = await client.query(api.auth.getState, { sessionId });
        if (authState.state !== 'authenticated') {
          return {
            success: false,
            error: 'Login completed but the session could not be verified.',
          };
        }
        return { success: true, sessionId, userName: authState.user.name };
      } catch (error) {
        return {
          success: false,
          error: `Login completed but session verification failed: ${errorMessage(error)}`,
        };
      }
    }

    if (loginRequest?.status === 'failed') {
      return { success: false, error: loginRequest.error ?? 'Login request failed.' };
    }

    await sleep(pollIntervalMs);
  }
}
