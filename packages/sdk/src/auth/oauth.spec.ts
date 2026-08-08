import { describe, expect, it } from 'vitest';

import { buildGoogleOAuthUrl, createOAuthState } from './oauth';

describe('createOAuthState', () => {
  it('encodes flow type, request id, and version', () => {
    const state = createOAuthState('login', 'req-123');
    expect(decodeURIComponent(state)).toBe(
      JSON.stringify({ flowType: 'login', requestId: 'req-123', version: 'v1' })
    );
  });

  it('includes returnTo when provided', () => {
    const state = createOAuthState('connect', 'req-456', '/app/profile');
    expect(decodeURIComponent(state)).toBe(
      JSON.stringify({
        flowType: 'connect',
        requestId: 'req-456',
        version: 'v1',
        returnTo: '/app/profile',
      })
    );
  });

  it('omits returnTo when not provided', () => {
    const state = createOAuthState('login', 'req-789');
    expect(JSON.parse(decodeURIComponent(state))).not.toHaveProperty('returnTo');
  });

  it('is deterministic for the same inputs', () => {
    expect(createOAuthState('login', 'req-123')).toBe(createOAuthState('login', 'req-123'));
  });
});

describe('buildGoogleOAuthUrl', () => {
  const url = buildGoogleOAuthUrl({
    clientId: 'client-123',
    redirectUri: 'http://localhost:3000/api/auth/google/callback',
    state: 'enc-state',
  });

  it('points at the Google authorization endpoint', () => {
    expect(url.startsWith('https://accounts.google.com/o/oauth2/v2/auth?')).toBe(true);
  });

  it('includes all required OAuth parameters', () => {
    const parsed = new URL(url);
    expect(parsed.searchParams.get('client_id')).toBe('client-123');
    expect(parsed.searchParams.get('redirect_uri')).toBe(
      'http://localhost:3000/api/auth/google/callback'
    );
    expect(parsed.searchParams.get('response_type')).toBe('code');
    expect(parsed.searchParams.get('scope')).toBe('openid email profile');
    expect(parsed.searchParams.get('state')).toBe('enc-state');
    expect(parsed.searchParams.get('prompt')).toBe('consent');
    expect(parsed.searchParams.get('access_type')).toBe('offline');
  });
});
