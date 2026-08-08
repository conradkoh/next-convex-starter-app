import type { ConvexHttpClient } from 'convex/browser';
import { describe, expect, it, vi } from 'vitest';

import { loginWithBrowser } from './login';

vi.mock('@workspace/backend/convex/_generated/api', () => ({
  api: {
    auth: {
      google: {
        createLoginRequest: 'api.auth.google.createLoginRequest',
        getConfig: 'api.auth.google.getConfig',
        getLoginRequest: 'api.auth.google.getLoginRequest',
      },
      getState: 'api.auth.getState',
    },
  },
}));

vi.mock('convex/browser', () => ({
  ConvexHttpClient: class {},
}));

const CREATE_LOGIN_REQUEST = 'api.auth.google.createLoginRequest';
const GET_CONFIG = 'api.auth.google.getConfig';
const GET_LOGIN_REQUEST = 'api.auth.google.getLoginRequest';
const GET_STATE = 'api.auth.getState';

type FakeMutation = ReturnType<typeof vi.fn>;
type FakeQuery = ReturnType<typeof vi.fn>;

function fakeClient(mutation: FakeMutation, query: FakeQuery): ConvexHttpClient {
  return { mutation, query } as unknown as ConvexHttpClient;
}

function loginRequestQueryHandler(options: {
  status: 'pending' | 'completed' | 'failed';
  error?: string;
}): FakeQuery {
  return vi.fn().mockImplementation(async (ref: unknown) => {
    if (ref === GET_CONFIG) {
      return { enabled: true, clientId: 'client-123' };
    }
    if (ref === GET_LOGIN_REQUEST) {
      return { status: options.status, error: options.error };
    }
    if (ref === GET_STATE) {
      return { state: 'authenticated', user: { name: 'Ada Lovelace' } };
    }
    throw new Error(`Unexpected query: ${String(ref)}`);
  });
}

describe('loginWithBrowser', () => {
  it('opens the browser with a Google OAuth URL for the created login request', async () => {
    const openBrowser = vi.fn(async (url: string) => {
      void url;
    });
    const mutation = vi.fn().mockResolvedValue({ loginId: 'login-123' });
    const query = loginRequestQueryHandler({ status: 'pending' });

    const result = await loginWithBrowser(
      {
        convexUrl: 'https://example.convex.cloud',
        webappUrl: 'http://localhost:3000',
        openBrowser,
        pollIntervalMs: 5,
        timeoutMs: 15,
      },
      { createClient: () => fakeClient(mutation, query) }
    );

    expect(result.success).toBe(false);
    expect(mutation).toHaveBeenCalledWith(CREATE_LOGIN_REQUEST, {
      sessionId: expect.any(String),
      redirectUri: 'http://localhost:3000/api/auth/google/callback',
    });
    expect(openBrowser).toHaveBeenCalledWith(
      expect.stringContaining('https://accounts.google.com/o/oauth2/v2/auth?')
    );
    expect(openBrowser).toHaveBeenCalledWith(expect.stringContaining('client_id=client-123'));
  });

  it('returns success with the user name once the login request completes', async () => {
    const mutation = vi.fn().mockResolvedValue({ loginId: 'login-123' });
    const query = loginRequestQueryHandler({ status: 'completed' });

    const result = await loginWithBrowser(
      {
        convexUrl: 'https://example.convex.cloud',
        webappUrl: 'http://localhost:3000',
        openBrowser: vi.fn(async () => {}),
      },
      { createClient: () => fakeClient(mutation, query) }
    );

    expect(result).toEqual({
      success: true,
      sessionId: expect.any(String),
      userName: 'Ada Lovelace',
    });
  });

  it('returns a failure when the login request fails', async () => {
    const mutation = vi.fn().mockResolvedValue({ loginId: 'login-123' });
    const query = loginRequestQueryHandler({
      status: 'failed',
      error: 'OAuth denied',
    });

    const result = await loginWithBrowser(
      {
        convexUrl: 'https://example.convex.cloud',
        webappUrl: 'http://localhost:3000',
        openBrowser: vi.fn(async () => {}),
      },
      { createClient: () => fakeClient(mutation, query) }
    );

    expect(result).toEqual({ success: false, error: 'OAuth denied' });
  });

  it('returns a failure when the login request times out', async () => {
    const mutation = vi.fn().mockResolvedValue({ loginId: 'login-123' });
    const query = loginRequestQueryHandler({ status: 'pending' });

    const result = await loginWithBrowser(
      {
        convexUrl: 'https://example.convex.cloud',
        webappUrl: 'http://localhost:3000',
        openBrowser: vi.fn(async () => {}),
        pollIntervalMs: 5,
        timeoutMs: 15,
      },
      { createClient: () => fakeClient(mutation, query) }
    );

    expect(result).toEqual({ success: false, error: expect.stringContaining('timed out') });
  });

  it('returns a failure when Google auth is disabled', async () => {
    const query = vi.fn().mockResolvedValue({ enabled: false, clientId: null });

    const result = await loginWithBrowser(
      {
        convexUrl: 'https://example.convex.cloud',
        webappUrl: 'http://localhost:3000',
        openBrowser: vi.fn(async () => {}),
      },
      { createClient: () => fakeClient(vi.fn().mockResolvedValue({ loginId: 'login-123' }), query) }
    );

    expect(result).toEqual({
      success: false,
      error: 'Google authentication is disabled or not configured.',
    });
  });

  it('returns a failure when the login request cannot be created', async () => {
    const mutation = vi.fn().mockRejectedValue(new Error('backend unreachable'));

    const result = await loginWithBrowser(
      {
        convexUrl: 'https://example.convex.cloud',
        webappUrl: 'http://localhost:3000',
        openBrowser: vi.fn(async () => {}),
      },
      { createClient: () => fakeClient(mutation, vi.fn()) }
    );

    expect(result).toEqual({
      success: false,
      error: expect.stringContaining('Failed to start login'),
    });
  });
});
