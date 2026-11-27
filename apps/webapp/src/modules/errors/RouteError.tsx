'use client';

import type { ErrorCode } from '@workspace/shared/domain/errors';
import { Loader2, RotateCw } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useTransition } from 'react';

import { Button, buttonVariants } from '@/components/ui/button';
import { describeError, isAuthExpiredError, reportError } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { SessionExpiredRedirect } from '@/modules/auth/SessionExpiredRedirect';
import { ErrorPanel } from '@/modules/errors/ErrorPanel';

export interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  /** e.g. 'route:root', 'route:admin', 'route:system-admin'. */
  scope: string;
  /** Used when the error is unknown. */
  fallbackMessage?: string;
  /** Default '/' and 'Go to home'. Admin segments pass '/app' and 'Back to app'. */
  homeHref?: Route;
  homeLabel?: string;
}

const ROUTE_ERROR_TITLES: Partial<Record<ErrorCode, string>> = {
  FORBIDDEN: "You don't have access",
  NOT_FOUND: "We couldn't find that",
  FEATURE_DISABLED: "This isn't available right now",
  INVALID_INPUT: "Something doesn't look right",
  CONFLICT: 'This page is out of date',
};
/** Retry is offered only where a retry can plausibly succeed. Unknown errors (code null) also retry. */
const RETRYABLE_CODES: ReadonlySet<ErrorCode> = new Set(['INTERNAL_ERROR', 'CONFLICT']);

/**
 * Shared body of every App Router error.tsx. Renders inside the root layout, so it may use
 * next/link and the router, but never provider hooks. Expired sessions redirect to /login.
 */
// fallow-ignore-next-line complexity
export function RouteError({
  error,
  reset,
  scope,
  fallbackMessage = "We couldn't load this page. Try again in a moment.",
  homeHref = '/',
  homeLabel = 'Go to home',
}: RouteErrorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    reportError({ error, scope, digest: error.digest });
  }, [error, scope]);

  if (isAuthExpiredError(error)) return <SessionExpiredRedirect />;

  const described = describeError(error, { fallback: fallbackMessage });
  const title = (described.code && ROUTE_ERROR_TITLES[described.code]) ?? 'Something went wrong';
  const canRetry = described.code === null || RETRYABLE_CODES.has(described.code);

  const retry = () => {
    startTransition(() => {
      if (error.digest) router.refresh();
      reset();
    });
  };

  return (
    <ErrorPanel
      variant="page"
      title={title}
      message={described.message}
      referenceId={described.referenceId ?? error.digest ?? null}
      devDetail={error.stack ?? error.message}
      actions={
        <>
          {canRetry ? (
            <Button
              onClick={retry}
              disabled={isPending}
              aria-busy={isPending}
              className="w-full sm:w-auto"
            >
              {isPending ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <RotateCw data-icon="inline-start" />
              )}
              {isPending ? 'Trying again…' : 'Try again'}
            </Button>
          ) : null}
          <Link
            href={homeHref}
            className={cn(
              buttonVariants({ variant: canRetry ? 'outline' : 'default' }),
              'w-full sm:w-auto'
            )}
          >
            {homeLabel}
          </Link>
        </>
      }
    />
  );
}
