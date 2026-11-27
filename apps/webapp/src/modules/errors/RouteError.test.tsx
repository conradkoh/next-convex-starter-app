import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConvexError } from 'convex/values';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RouteError } from './RouteError';

import { setErrorReporter, type ErrorReport } from '@/lib/errors';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh, push: mocks.push }),
}));

describe('RouteError', () => {
  let restoreReporter: () => void;
  let reporter: (report: ErrorReport) => void;
  let reset: () => void;

  beforeEach(() => {
    mocks.replace.mockReset();
    mocks.refresh.mockReset();
    mocks.push.mockReset();
    reset = vi.fn<() => void>();
    reporter = vi.fn<(report: ErrorReport) => void>();
    restoreReporter = setErrorReporter(reporter);
  });

  afterEach(() => {
    restoreReporter();
    vi.unstubAllEnvs();
  });

  it('renders the unknown-error copy with retry and home actions', () => {
    render(<RouteError error={new Error('secret internals')} reset={reset} scope="route:root" />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Something went wrong');
    expect(
      screen.getByText("We couldn't load this page. Try again in a moment.")
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to home' })).toHaveAttribute('href', '/');
  });

  it('retries by refreshing first when a digest is present, then resetting', async () => {
    const user = userEvent.setup();
    render(
      <RouteError
        error={Object.assign(new Error('segmented'), { digest: 'd1g3st' })}
        reset={reset}
        scope="route:root"
      />
    );

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('renders FORBIDDEN without retry, with a primary home action and no redirect', () => {
    render(
      <RouteError
        error={new ConvexError({ code: 'FORBIDDEN', message: 'Cannot view this' })}
        reset={reset}
        scope="route:root"
      />
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("You don't have access");
    expect(screen.getByText('Cannot view this')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
    const home = screen.getByRole('link', { name: 'Go to home' });
    expect(home).toHaveAttribute('href', '/');
    expect(home).toHaveClass('bg-primary');
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('renders the INTERNAL_ERROR copy with retry', () => {
    render(
      <RouteError
        error={new ConvexError({ code: 'INTERNAL_ERROR', message: 'stack detail' })}
        reset={reset}
        scope="route:root"
      />
    );

    expect(
      screen.getByText('Something went wrong on our side. Please try again.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('renders the CONFLICT copy with retry', () => {
    render(
      <RouteError
        error={new ConvexError({ code: 'CONFLICT', message: 'Changed upstream' })}
        reset={reset}
        scope="route:root"
      />
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('This page is out of date');
    expect(screen.getByText('Changed upstream')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it.each([
    {
      code: 'NOT_FOUND',
      title: "We couldn't find that",
      message: 'No user with that email.',
      body: 'No user with that email.',
    },
    {
      code: 'INVALID_INPUT',
      title: "Something doesn't look right",
      message: '',
      body: "Some of the information provided isn't valid. Check it and try again.",
    },
    {
      code: 'FEATURE_DISABLED',
      title: "This isn't available right now",
      message: '',
      body: "This feature isn't available right now.",
    },
    {
      code: 'EMAIL_ALREADY_EXISTS',
      title: 'Something went wrong',
      message: 'That email is already registered.',
      body: 'That email is already registered.',
    },
  ] as const)('maps $code to its title and body', ({ code, title, message, body }) => {
    render(
      <RouteError error={new ConvexError({ code, message })} reset={reset} scope="route:root" />
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(title);
    expect(screen.getByText(body)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('redirects an expired session to /login', async () => {
    render(
      <RouteError
        error={new ConvexError({ code: 'NOT_AUTHENTICATED', message: 'Not authenticated' })}
        reset={reset}
        scope="route:root"
      />
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      'Your session has expired. Redirecting to sign in…'
    );
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/login'));
  });

  it('shows the digest reference and hides raw messages in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    render(
      <RouteError
        error={Object.assign(new Error('Secret internal detail'), { digest: 'd1g3st' })}
        reset={reset}
        scope="route:root"
      />
    );

    expect(screen.getByText(/Reference:/)).toHaveTextContent('Reference: d1g3st');
    expect(screen.queryByText('Technical details (development only)')).not.toBeInTheDocument();
    expect(screen.queryByText('Secret internal detail')).not.toBeInTheDocument();
  });

  it('honours admin home props', () => {
    render(
      <RouteError
        error={new ConvexError({ code: 'FORBIDDEN', message: 'Nope' })}
        reset={reset}
        scope="route:admin"
        homeHref="/app"
        homeLabel="Back to app"
      />
    );

    expect(screen.getByRole('link', { name: 'Back to app' })).toHaveAttribute('href', '/app');
  });

  it('reports the caught error with its scope', async () => {
    render(<RouteError error={new Error('boom')} reset={reset} scope="route:admin" />);

    await waitFor(() =>
      expect(reporter).toHaveBeenCalledWith(expect.objectContaining({ scope: 'route:admin' }))
    );
  });
});
