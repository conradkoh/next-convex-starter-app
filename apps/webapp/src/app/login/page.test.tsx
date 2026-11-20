import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import LoginPage from './page';

const HOSTED_CONVEX_URL = 'https://happy-animal-123.convex.cloud';
const LOCAL_CONVEX_URL = 'http://127.0.0.1:3210';

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
    expect(
      screen.getByText('Local development: anonymous login is always available.')
    ).toBeInTheDocument();
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
    expect(
      screen.queryByText('Local development: anonymous login is always available.')
    ).not.toBeInTheDocument();
  });
});
