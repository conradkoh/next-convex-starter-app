import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createOAuthState, getOAuthCallbackReturnTo, launchGoogleOAuth } from './google-oauth';

describe('shouldUseGoogleOAuthRedirect', () => {
  const originalNavigator = global.navigator;
  const assign = vi.fn();

  beforeEach(() => {
    assign.mockClear();
    Object.defineProperty(window, 'location', {
      value: { assign },
      writable: true,
    });
    vi.spyOn(window, 'open').mockReturnValue(null);
  });

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
    vi.restoreAllMocks();
  });

  function mockUserAgent(userAgent: string) {
    Object.defineProperty(global, 'navigator', {
      value: { userAgent },
      writable: true,
    });
  }

  it('uses redirect for iOS Safari', () => {
    mockUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    );
    expect(launchGoogleOAuth({ authUrl: 'https://example.com/oauth', popupName: 'test' })).toBe(
      'redirect'
    );
    expect(assign).toHaveBeenCalledWith('https://example.com/oauth');
  });

  it('uses redirect for iOS Chrome (WebKit)', () => {
    mockUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1'
    );
    expect(launchGoogleOAuth({ authUrl: 'https://example.com/oauth', popupName: 'test' })).toBe(
      'redirect'
    );
  });

  it('uses redirect for desktop Safari', () => {
    mockUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
    );
    expect(launchGoogleOAuth({ authUrl: 'https://example.com/oauth', popupName: 'test' })).toBe(
      'redirect'
    );
  });

  it('uses popup for desktop Chrome when window.open succeeds', () => {
    mockUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    const popup = { closed: false, close: vi.fn() };
    vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window);

    expect(launchGoogleOAuth({ authUrl: 'https://example.com/oauth', popupName: 'test' })).toBe(
      'popup'
    );
    expect(assign).not.toHaveBeenCalled();
  });
});

describe('createOAuthState', () => {
  it('includes returnTo when provided', () => {
    const state = createOAuthState('login', 'req-123', '/app');
    const parsed = JSON.parse(decodeURIComponent(state));
    expect(parsed).toEqual({
      flowType: 'login',
      requestId: 'req-123',
      version: 'v1',
      returnTo: '/app',
    });
  });

  it('omits returnTo when not provided', () => {
    const state = createOAuthState('connect', 'req-456');
    const parsed = JSON.parse(decodeURIComponent(state));
    expect(parsed).toEqual({
      flowType: 'connect',
      requestId: 'req-456',
      version: 'v1',
    });
  });
});

describe('getOAuthCallbackReturnTo', () => {
  it('returns returnTo from state when present', () => {
    const state = createOAuthState('login', 'req-123', '/app/dashboard');
    expect(getOAuthCallbackReturnTo(state)).toBe('/app/dashboard');
  });

  it('defaults to /login for login flow without returnTo', () => {
    const state = createOAuthState('login', 'req-123');
    expect(getOAuthCallbackReturnTo(state)).toBe('/login');
  });

  it('defaults to /app/profile for connect flow without returnTo', () => {
    const state = createOAuthState('connect', 'req-123');
    expect(getOAuthCallbackReturnTo(state)).toBe('/app/profile');
  });

  it('returns undefined for invalid state', () => {
    expect(getOAuthCallbackReturnTo('not-valid-json')).toBe('/login');
  });
});
