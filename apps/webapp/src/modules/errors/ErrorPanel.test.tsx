import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ErrorPanel } from './ErrorPanel';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('ErrorPanel', () => {
  it('renders a page panel as the single h1 alert with the message', () => {
    render(<ErrorPanel message="We couldn't load this page. Try again in a moment." />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Something went wrong');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByRole('alert')).toHaveTextContent(
      "We couldn't load this page. Try again in a moment."
    );
  });

  it('renders an h1 for the screen variant and an h2 for the region variant', () => {
    const { unmount } = render(<ErrorPanel message="App down" variant="screen" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Something went wrong');
    unmount();

    render(<ErrorPanel message="Section down" variant="region" />);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('shows Reference only when a reference id is given', () => {
    const { unmount } = render(<ErrorPanel message="Boom" />);
    expect(screen.queryByText(/Reference:/)).not.toBeInTheDocument();
    unmount();

    render(<ErrorPanel message="Boom" referenceId="abc123" />);
    expect(screen.getByText(/Reference:/)).toHaveTextContent('Reference: abc123');
  });

  it('renders the dev-only technical details outside production and hides them in production', () => {
    const { unmount } = render(<ErrorPanel message="Boom" devDetail="stack trace" />);
    expect(screen.getByText('Technical details (development only)')).toBeInTheDocument();
    expect(screen.getByText('stack trace')).toBeInTheDocument();
    unmount();

    vi.stubEnv('NODE_ENV', 'production');
    render(<ErrorPanel message="Boom" devDetail="stack trace" />);
    expect(screen.queryByText('Technical details (development only)')).not.toBeInTheDocument();
    expect(screen.queryByText('stack trace')).not.toBeInTheDocument();
  });

  it('focuses the heading for page and screen but not for region', () => {
    const { unmount } = render(<ErrorPanel message="Boom" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
    unmount();

    const screenRender = render(<ErrorPanel message="Boom" variant="screen" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
    screenRender.unmount();

    render(<ErrorPanel message="Boom" variant="region" />);
    expect(screen.getByRole('heading', { level: 2 })).not.toHaveFocus();
  });

  it('uses the neutral tone without destructive text classes', () => {
    const { unmount } = render(<ErrorPanel message="Missing" tone="neutral" />);
    expect(screen.getByRole('alert')).not.toHaveClass('text-destructive');
    unmount();

    render(<ErrorPanel message="Missing" />);
    expect(screen.getByRole('alert')).toHaveClass('text-destructive');
  });
});
