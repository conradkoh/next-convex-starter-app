import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConvexError } from 'convex/values';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrorBoundary, useErrorBoundaryState } from './ErrorBoundary';
import { NavigationFallback } from './NavigationFallback';

import { describeError, setErrorReporter, type ErrorReport } from '@/lib/errors';
import { AppUnavailable } from '@/modules/errors/AppUnavailable';

let shouldThrow = false;

function Thrower({ message = 'boundary boom' }: { message?: string }) {
  if (shouldThrow) throw new Error(message);
  return <p>Child is fine</p>;
}

function ContextReader() {
  const state = useErrorBoundaryState();
  return <p>{state ? state.error.message : 'no boundary'}</p>;
}

describe('ErrorBoundary', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;
  let restoreReporter: () => void;
  let reporter: (report: ErrorReport) => void;

  beforeEach(() => {
    shouldThrow = false;
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    reporter = vi.fn<(report: ErrorReport) => void>();
    restoreReporter = setErrorReporter(reporter);
  });

  afterEach(() => {
    consoleError.mockRestore();
    restoreReporter();
  });

  it('shows the fallback when a child throws and reports it once with the scope', () => {
    shouldThrow = true;
    render(
      <ErrorBoundary scope="test-scope" fallback={<p>Fallback shown</p>}>
        <Thrower />
      </ErrorBoundary>
    );

    expect(screen.getByText('Fallback shown')).toBeInTheDocument();
    expect(reporter).toHaveBeenCalledTimes(1);
    expect(reporter).toHaveBeenCalledWith(expect.objectContaining({ scope: 'test-scope' }));
  });

  it('exposes the error through context to a rendered fallback element', () => {
    shouldThrow = true;
    render(
      <ErrorBoundary scope="test-scope" fallback={<ContextReader />}>
        <Thrower message="context boom" />
      </ErrorBoundary>
    );

    expect(screen.getByText('context boom')).toBeInTheDocument();
  });

  it('re-renders the child after reset once the cause is cleared', async () => {
    shouldThrow = true;
    const user = userEvent.setup();
    render(
      <ErrorBoundary
        scope="test-scope"
        fallback={({ reset }) => <button onClick={reset}>Reset boundary</button>}
      >
        <Thrower />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: 'Reset boundary' })).toBeInTheDocument();

    shouldThrow = false;
    await user.click(screen.getByRole('button', { name: 'Reset boundary' }));

    expect(screen.getByText('Child is fine')).toBeInTheDocument();
  });

  it('does not catch an event-handler rejection, which stays inline', async () => {
    const save = () =>
      Promise.reject(new ConvexError({ code: 'INVALID_INPUT', message: 'Cannot save' }));
    function InlineFailure() {
      const [message, setMessage] = useState<string | null>(null);
      return (
        <div>
          <button
            onClick={() => {
              save().catch((error) => {
                setMessage(describeError(error, { fallback: 'Could not save.' }).message);
              });
            }}
          >
            Save
          </button>
          {message ? <p role="alert">{message}</p> : null}
        </div>
      );
    }

    const user = userEvent.setup();
    render(
      <ErrorBoundary scope="test-scope" fallback={<p>Boundary fallback</p>}>
        <InlineFailure />
      </ErrorBoundary>
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot save');
    expect(screen.queryByText('Boundary fallback')).not.toBeInTheDocument();
  });

  it('shows the reference id in AppUnavailable when it is the element fallback', () => {
    shouldThrow = true;
    render(
      <ErrorBoundary scope="app-providers" fallback={<AppUnavailable />}>
        <Thrower message="[CONVEX Q(x)] [Request ID: abc123] Server Error" />
      </ErrorBoundary>
    );

    expect(screen.getByText("The app isn't available right now")).toBeInTheDocument();
    expect(screen.getByText(/Reference:/)).toHaveTextContent('Reference: abc123');
  });

  it('keeps the page body and navigation fallback visible when navigation throws', () => {
    shouldThrow = true;
    render(
      <>
        <ErrorBoundary scope="navigation" fallback={<NavigationFallback />}>
          <Thrower message="navigation boom" />
        </ErrorBoundary>
        <main>Page body</main>
      </>
    );

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByText('Page body')).toBeInTheDocument();
  });
});
