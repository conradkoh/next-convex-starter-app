'use client';

import { Loader2, RotateCw } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { toClientError } from '@/lib/errors';
import { useErrorBoundaryState, type CaughtError } from '@/modules/errors/ErrorBoundary';
import { ErrorPanel } from '@/modules/errors/ErrorPanel';

export interface AppUnavailableProps {
  /** Passed by global-error.tsx. The provider-tier boundary passes nothing; the error comes from context. */
  error?: CaughtError | null;
}

/** Whole-app failure screen. Provider-free: no links, router, theme, auth or Convex hooks. */
// fallow-ignore-next-line complexity
export function AppUnavailable({ error }: AppUnavailableProps) {
  const boundary = useErrorBoundaryState();
  const caught = error ?? boundary?.error ?? null;
  const [isReloading, setIsReloading] = useState(false);
  const referenceId = caught ? (toClientError(caught).referenceId ?? caught.digest ?? null) : null;

  return (
    <ErrorPanel
      variant="screen"
      title="The app isn't available right now"
      message="Reload the page to try again. If it keeps happening, try again in a few minutes."
      referenceId={referenceId}
      devDetail={caught ? (caught.stack ?? caught.message) : null}
      actions={
        <Button
          disabled={isReloading}
          aria-busy={isReloading}
          className="w-full sm:w-auto"
          onClick={() => {
            setIsReloading(true);
            window.location.reload();
          }}
        >
          {isReloading ? (
            <Loader2 data-icon="inline-start" className="animate-spin" />
          ) : (
            <RotateCw data-icon="inline-start" />
          )}
          {isReloading ? 'Reloading…' : 'Reload page'}
        </Button>
      }
    />
  );
}
