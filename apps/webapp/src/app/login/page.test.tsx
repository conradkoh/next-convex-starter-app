import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import LoginPage from './page';

const HOSTED_CONVEX_URL = 'https://happy-animal-123.convex.cloud';
const LOCAL_CONVEX_URL = 'http://127.0.0.1:3210';

const SIGNUPS_CLOSED_TEXT = 'Sign-ups are currently closed';
const LOCAL_DEV_HINT_TEXT = 'Local development: anonymous login is always available.';
const INVITE_ONLY_HINT_TEXT =
  'New users must sign up with an invite code. Google sign-in below is for returning users.';

const mockFeatureFlags = vi.hoisted(() => ({
  disableLogin: false,
  allowedSignupMethods: ['self'] as string[] | null,
}));

vi.mock('@workspace/backend/config/featureFlags', () => ({
  featureFlags: mockFeatureFlags,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/modules/auth/AuthProvider', () => ({
  useAuthState: () => ({ state: 'unauthenticated' }),
}));

vi.mock('@/components/SearchParamsErrorHandler', () => ({
  SearchParamsErrorHandler: () => null,
}));

vi.mock('@/modules/auth/GoogleLoginButton', () => ({
  GoogleLoginButton: () => <div data-testid="google-login" />,
}));

vi.mock('@/modules/auth/AnonymousLoginButton', () => ({
  AnonymousLoginButton: () => <div data-testid="anonymous-login" />,
}));

beforeEach(() => {
  mockFeatureFlags.disableLogin = false;
  mockFeatureFlags.allowedSignupMethods = ['self'];
  localStorage.setItem('sessionId', 'test-session');
});

afterEach(() => {
  vi.unstubAllEnvs();
  localStorage.clear();
});

describe('LoginPage local development handling', () => {
  it('shows the disabled card on a hosted deployment when login is disabled', () => {
    vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', HOSTED_CONVEX_URL);
    mockFeatureFlags.disableLogin = true;

    render(<LoginPage />);

    expect(screen.getByText('Login Disabled')).toBeInTheDocument();
    expect(screen.queryByTestId('anonymous-login')).not.toBeInTheDocument();
  });

  it('offers only anonymous login locally when login is disabled', () => {
    vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', LOCAL_CONVEX_URL);
    mockFeatureFlags.disableLogin = true;

    render(<LoginPage />);

    expect(screen.getByTestId('anonymous-login')).toBeInTheDocument();
    expect(screen.queryByText('Login Disabled')).not.toBeInTheDocument();
    expect(screen.queryByTestId('google-login')).not.toBeInTheDocument();
    expect(screen.queryByText('Enter Login Code')).not.toBeInTheDocument();
    expect(screen.queryByText('Lost access to your account?')).not.toBeInTheDocument();
    expect(screen.queryByText('Sign up with Invite Code')).not.toBeInTheDocument();
    expect(screen.getByText(LOCAL_DEV_HINT_TEXT)).toBeInTheDocument();
  });

  it('offers anonymous and invite options locally when only invite signup is allowed', () => {
    vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', LOCAL_CONVEX_URL);
    mockFeatureFlags.allowedSignupMethods = ['invite'];

    render(<LoginPage />);

    expect(screen.getByTestId('anonymous-login')).toBeInTheDocument();
    expect(screen.getByText('Sign up with Invite Code')).toBeInTheDocument();
  });

  it('does not offer anonymous login on a hosted deployment when only invite signup is allowed', () => {
    vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', HOSTED_CONVEX_URL);
    mockFeatureFlags.allowedSignupMethods = ['invite'];

    render(<LoginPage />);

    expect(screen.queryByTestId('anonymous-login')).not.toBeInTheDocument();
    expect(screen.getByText('Sign up with Invite Code')).toBeInTheDocument();
  });

  it('offers anonymous login on a hosted deployment when self signup is allowed', () => {
    vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', HOSTED_CONVEX_URL);
    mockFeatureFlags.allowedSignupMethods = ['self'];

    render(<LoginPage />);

    expect(screen.getByTestId('anonymous-login')).toBeInTheDocument();
    expect(screen.queryByText(LOCAL_DEV_HINT_TEXT)).not.toBeInTheDocument();
  });
});

describe('LoginPage signups-closed banner', () => {
  it.each([null, []] as (string[] | null)[])(
    'hides the banner locally when allowedSignupMethods is %j but anonymous login is offered',
    (methods) => {
      vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', LOCAL_CONVEX_URL);
      mockFeatureFlags.allowedSignupMethods = methods;

      render(<LoginPage />);

      expect(screen.getByTestId('anonymous-login')).toBeInTheDocument();
      expect(screen.queryByText(SIGNUPS_CLOSED_TEXT)).not.toBeInTheDocument();
    }
  );

  it.each([null, []] as (string[] | null)[])(
    'shows the banner and hides anonymous login on a hosted deployment when allowedSignupMethods is %j',
    (methods) => {
      vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', HOSTED_CONVEX_URL);
      mockFeatureFlags.disableLogin = false;
      mockFeatureFlags.allowedSignupMethods = methods;

      render(<LoginPage />);

      expect(screen.getByText(SIGNUPS_CLOSED_TEXT)).toBeInTheDocument();
      expect(screen.queryByTestId('anonymous-login')).not.toBeInTheDocument();
    }
  );

  it('keeps the Login Disabled card over the banner and options on a hosted deployment', () => {
    vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', HOSTED_CONVEX_URL);
    mockFeatureFlags.disableLogin = true;
    mockFeatureFlags.allowedSignupMethods = null;

    render(<LoginPage />);

    expect(screen.getByText('Login Disabled')).toBeInTheDocument();
    expect(screen.queryByText(SIGNUPS_CLOSED_TEXT)).not.toBeInTheDocument();
    expect(screen.queryByTestId('anonymous-login')).not.toBeInTheDocument();
  });
});

describe('LoginPage local development hints', () => {
  it('shows no local-dev hint locally when self signup is allowed', () => {
    vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', LOCAL_CONVEX_URL);
    mockFeatureFlags.allowedSignupMethods = ['self'];

    render(<LoginPage />);

    expect(screen.getByTestId('anonymous-login')).toBeInTheDocument();
    expect(screen.queryByText(LOCAL_DEV_HINT_TEXT)).not.toBeInTheDocument();
  });

  it('shows only the local-dev hint locally when only invite signup is allowed', () => {
    vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', LOCAL_CONVEX_URL);
    mockFeatureFlags.allowedSignupMethods = ['invite'];

    render(<LoginPage />);

    expect(screen.getByTestId('anonymous-login')).toBeInTheDocument();
    expect(screen.getByText('Sign up with Invite Code')).toBeInTheDocument();
    expect(screen.getByText(LOCAL_DEV_HINT_TEXT)).toBeInTheDocument();
    expect(screen.queryByText(INVITE_ONLY_HINT_TEXT)).not.toBeInTheDocument();
  });

  it('renders the local-only form without a stored sessionId, with no anonymous option and the local-dev hint', () => {
    vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', LOCAL_CONVEX_URL);
    mockFeatureFlags.disableLogin = true;
    localStorage.removeItem('sessionId');

    render(<LoginPage />);

    expect(screen.queryByTestId('anonymous-login')).not.toBeInTheDocument();
    expect(screen.getByText(LOCAL_DEV_HINT_TEXT)).toBeInTheDocument();
  });
});

describe('LoginPage unparseable deployment URL', () => {
  it.each([undefined, 'not a url'])(
    'behaves as hosted when NEXT_PUBLIC_CONVEX_URL is %s',
    (url) => {
      vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', url);
      mockFeatureFlags.allowedSignupMethods = null;

      render(<LoginPage />);

      expect(screen.getByText(SIGNUPS_CLOSED_TEXT)).toBeInTheDocument();
      expect(screen.queryByTestId('anonymous-login')).not.toBeInTheDocument();
      expect(screen.queryByText(LOCAL_DEV_HINT_TEXT)).not.toBeInTheDocument();
    }
  );
});
