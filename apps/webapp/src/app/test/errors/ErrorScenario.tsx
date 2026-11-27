'use client';

import { RotateCw } from 'lucide-react';
import { useSyncExternalStore } from 'react';

import { Button } from '@/components/ui/button';
import { describeError } from '@/lib/errors';
import { AppUnavailable } from '@/modules/errors/AppUnavailable';
import { ErrorBoundary } from '@/modules/errors/ErrorBoundary';
import { ErrorPanel } from '@/modules/errors/ErrorPanel';

export type ErrorScenarioMode = 'render' | 'auth' | 'forbidden' | 'region' | 'screen';

const RECOVER_KEY = 'test-errors:recover';

function subscribeNoop() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

/** True only after hydration, so the throw happens in the browser (route boundary), not on the server. */
function useIsClient(): boolean {
  return useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot);
}

function hasRecovered(): boolean {
  return sessionStorage.getItem(RECOVER_KEY) === '1';
}

function ThrowingWidget() {
  if (!hasRecovered()) throw new Error('Simulated widget failure (test page)');
  return <p>Widget recovered</p>;
}

function ScenarioList() {
  return (
    <p>
      Choose a scenario: <code>?mode=render|auth|forbidden|region|screen</code>
    </p>
  );
}

/**
 * Dev-only error scenarios for the Playwright error-boundary spec and the design screenshots.
 * `sessionStorage['test-errors:recover'] = '1'` makes the throwing scenarios recover on retry.
 */
// fallow-ignore-next-line complexity
export function ErrorScenario({ mode }: { mode: ErrorScenarioMode | null }) {
  const isClient = useIsClient();

  if (!isClient) return <p>Loading scenario…</p>;

  if (mode === 'render') {
    if (!hasRecovered()) throw new Error('Simulated render failure (test page)');
    return <p>Recovered</p>;
  }

  if (mode === 'auth') {
    throw Object.assign(
      new Error(
        '[CONVEX Q(test:errors)] [Request ID: e2eauth1] {"code":"NOT_AUTHENTICATED","message":"Not authenticated"}'
      ),
      { data: { code: 'NOT_AUTHENTICATED', message: 'Not authenticated' } }
    );
  }

  if (mode === 'forbidden') {
    throw Object.assign(
      new Error(
        '[CONVEX Q(test:errors)] [Request ID: e2eforb1] {"code":"FORBIDDEN","message":"You do not have permission to perform this action"}'
      ),
      {
        data: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action',
        },
      }
    );
  }

  if (mode === 'region') {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 sm:p-8">
        <h1>Region scenario</h1>
        <p>Content above the region</p>
        <ErrorBoundary
          scope="widget:test-errors"
          fallback={({ error, reset }) => {
            const d = describeError(error, {
              fallback: 'Something went wrong while loading this section.',
            });
            return (
              <ErrorPanel
                variant="region"
                title="This section couldn't load"
                message={d.message}
                referenceId={d.referenceId}
                devDetail={error.stack ?? error.message}
                actions={
                  <Button variant="outline" size="sm" onClick={reset}>
                    <RotateCw data-icon="inline-start" />
                    Try again
                  </Button>
                }
              />
            );
          }}
        >
          <ThrowingWidget />
        </ErrorBoundary>
        <p>Content below the region</p>
      </div>
    );
  }

  if (mode === 'screen') return <AppUnavailable />;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 sm:p-8">
      <ScenarioList />
    </div>
  );
}
