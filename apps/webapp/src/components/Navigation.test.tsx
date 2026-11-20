import { render, screen } from '@testing-library/react';
import type { Id } from '@workspace/backend/convex/_generated/dataModel';
import type { ComponentProps, ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Navigation } from './Navigation';

import { useAuthState } from '@/modules/auth/AuthProvider';

const HOSTED_CONVEX_URL = 'https://happy-animal-123.convex.cloud';
const LOCAL_CONVEX_URL = 'http://127.0.0.1:3210';

const mockFeatureFlags = vi.hoisted(() => ({
  disableLogin: false,
}));

// Mock the auth module
vi.mock('@/modules/auth/AuthProvider', () => ({
  useAuthState: vi.fn(),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: { href: string; children: ReactNode } & ComponentProps<'a'>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock UserMenu component
vi.mock('@/components/UserMenu', () => ({
  UserMenu: () => <div data-testid="user-menu">User Menu</div>,
}));

// Mock feature flags. Only the flag is stubbed; the real local-development predicate runs.
vi.mock('@workspace/backend/config/featureFlags', () => ({
  featureFlags: mockFeatureFlags,
}));

describe('Navigation', () => {
  it('renders login button when user is not authenticated', () => {
    vi.mocked(useAuthState).mockReturnValue({
      sessionId: 'test-session',
      state: 'unauthenticated',
      reason: 'test',
    });

    render(<Navigation />);

    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
  });

  it('renders user menu when user is authenticated', () => {
    vi.mocked(useAuthState).mockReturnValue({
      sessionId: 'test-session',
      state: 'authenticated',
      user: {
        _id: 'test-user-id' as Id<'users'>,
        _creationTime: Date.now(),
        type: 'anonymous',
        name: 'Test User',
      },
      accessLevel: 'user',
      permissions: ['attendance:read', 'presentation:read'],
    });

    render(<Navigation />);

    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
  });

  it('renders nothing when auth state is loading', () => {
    vi.mocked(useAuthState).mockReturnValue(undefined);

    render(<Navigation />);

    // Should not render login button or user menu
    expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
    expect(screen.queryByTestId('user-menu')).not.toBeInTheDocument();
  });

  it('renders brand as non-link while auth state is loading', () => {
    vi.mocked(useAuthState).mockReturnValue(undefined);

    render(<Navigation />);

    expect(screen.getByText('Next Convex')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /next convex/i })).not.toBeInTheDocument();
  });

  it('links brand to / when user is unauthenticated', () => {
    vi.mocked(useAuthState).mockReturnValue({
      sessionId: 'test-session',
      state: 'unauthenticated',
      reason: 'test',
    });

    render(<Navigation />);

    const brandLink = screen.getByRole('link', { name: /next convex/i });
    expect(brandLink).toHaveAttribute('href', '/');
  });

  it('links brand to /app when user is authenticated', () => {
    vi.mocked(useAuthState).mockReturnValue({
      sessionId: 'test-session',
      state: 'authenticated',
      user: {
        _id: 'test-user-id' as Id<'users'>,
        _creationTime: Date.now(),
        type: 'anonymous',
        name: 'Test User',
      },
      accessLevel: 'user',
      permissions: ['attendance:read', 'presentation:read'],
    });

    render(<Navigation />);

    const brandLink = screen.getByRole('link', { name: /next convex/i });
    expect(brandLink).toHaveAttribute('href', '/app');
  });
});

describe('Navigation login link with login disabled', () => {
  beforeEach(() => {
    mockFeatureFlags.disableLogin = true;
  });

  afterEach(() => {
    mockFeatureFlags.disableLogin = false;
    vi.unstubAllEnvs();
  });

  it('shows a Login link to /login locally when login is disabled', () => {
    vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', LOCAL_CONVEX_URL);
    vi.mocked(useAuthState).mockReturnValue({
      sessionId: 'test-session',
      state: 'unauthenticated',
      reason: 'test',
    });

    render(<Navigation />);

    expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute('href', '/login');
  });

  it.each([
    ['a hosted URL', HOSTED_CONVEX_URL],
    ['an unparseable URL', 'not a url'],
    ['a missing URL', undefined],
  ])('hides the Login link when login is disabled and the Convex URL is %s', (_label, url) => {
    vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', url);
    vi.mocked(useAuthState).mockReturnValue({
      sessionId: 'test-session',
      state: 'unauthenticated',
      reason: 'test',
    });

    render(<Navigation />);

    expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
  });

  it.each([
    ['local', LOCAL_CONVEX_URL],
    ['hosted', HOSTED_CONVEX_URL],
  ])('shows the Login link on a %s deployment when login is enabled', (_label, url) => {
    vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', url);
    mockFeatureFlags.disableLogin = false;
    vi.mocked(useAuthState).mockReturnValue({
      sessionId: 'test-session',
      state: 'unauthenticated',
      reason: 'test',
    });

    render(<Navigation />);

    expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute('href', '/login');
  });

  it('shows no Login link while auth state is loading locally', () => {
    vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', LOCAL_CONVEX_URL);
    vi.mocked(useAuthState).mockReturnValue(undefined);

    render(<Navigation />);

    expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
    expect(screen.queryByTestId('user-menu')).not.toBeInTheDocument();
  });

  it('shows the user menu instead of a Login link when authenticated locally', () => {
    vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', LOCAL_CONVEX_URL);
    vi.mocked(useAuthState).mockReturnValue({
      sessionId: 'test-session',
      state: 'authenticated',
      user: {
        _id: 'test-user-id' as Id<'users'>,
        _creationTime: Date.now(),
        type: 'anonymous',
        name: 'Test User',
      },
      accessLevel: 'user',
      permissions: ['attendance:read', 'presentation:read'],
    });

    render(<Navigation />);

    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
  });
});
