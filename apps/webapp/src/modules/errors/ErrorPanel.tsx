'use client';

import { AlertCircle } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export interface ErrorPanelProps {
  /** Short sentence-case headline. Default 'Something went wrong'. */
  title?: string;
  /** Already user-safe copy from describeError(). Never raw Error.message. */
  message: string;
  /** Convex Request ID or Next digest. Rendered as 'Reference: <id>'. Omitted when absent. */
  referenceId?: string | null;
  /** error.stack or message. Rendered only when NODE_ENV !== 'production'. */
  devDetail?: string | null;
  /** region: inside a page. page: replaces page content in the shell. screen: replaces the viewport. Default 'page'. */
  variant?: 'region' | 'page' | 'screen';
  /** 'error' -> Alert destructive. 'neutral' -> Alert default (not-found). Default 'error'. */
  tone?: 'error' | 'neutral';
  /** Defaults to <AlertCircle/> sized per variant. Pass an element (not a component) so server files can use it. */
  icon?: ReactNode;
  /** Defaults: region 2, page and screen 1. */
  headingLevel?: 1 | 2 | 3;
  /** Focus the heading on mount. Default: true for page and screen, false for region. */
  autoFocus?: boolean;
  /** Buttons or link-buttons; the caller owns handlers. */
  actions?: ReactNode;
}

/**
 * One calm, consistent inline error panel for every surface. Message must already be user-safe.
 * Body copy stays muted even on the destructive alert; only the title and icon carry the tone.
 */
// fallow-ignore-next-line complexity
export function ErrorPanel({
  title = 'Something went wrong',
  message,
  referenceId,
  devDetail,
  variant = 'page',
  tone = 'error',
  icon,
  headingLevel,
  autoFocus,
  actions,
}: ErrorPanelProps) {
  const isRegion = variant === 'region';
  const Heading = `h${headingLevel ?? (isRegion ? 2 : 1)}` as 'h1' | 'h2' | 'h3';
  const headingRef = useRef<HTMLHeadingElement>(null);
  const shouldFocus = autoFocus ?? !isRegion;

  useEffect(() => {
    if (shouldFocus) headingRef.current?.focus();
  }, [shouldFocus]);

  const body = (
    <div
      data-slot="error-panel"
      data-variant={variant}
      className={cn('flex w-full flex-col', isRegion ? 'gap-3' : 'gap-4')}
    >
      <Alert
        variant={tone === 'error' ? 'destructive' : 'default'}
        className="*:data-[slot=alert-description]:text-muted-foreground"
      >
        {icon ?? <AlertCircle className={isRegion ? undefined : 'size-5'} />}
        <AlertTitle>
          <Heading
            ref={headingRef}
            tabIndex={-1}
            className={cn(
              'outline-none',
              isRegion ? 'text-sm font-medium' : 'text-base leading-snug font-semibold'
            )}
          >
            {title}
          </Heading>
        </AlertTitle>
        <AlertDescription className="[&_p:not(:last-child)]:mb-2">
          <p>{message}</p>
          {referenceId ? (
            <p className="font-mono text-xs tabular-nums break-all">
              Reference: <span className="select-all">{referenceId}</span>
            </p>
          ) : null}
        </AlertDescription>
      </Alert>

      {actions ? (
        <div className={cn('flex gap-2', isRegion ? 'flex-row flex-wrap' : 'flex-col sm:flex-row')}>
          {actions}
        </div>
      ) : null}

      {devDetail && process.env.NODE_ENV !== 'production' ? (
        <details className="rounded-md border bg-muted/40 text-xs">
          <summary className="cursor-pointer px-3 py-2 text-muted-foreground select-none">
            Technical details (development only)
          </summary>
          <pre className="max-h-60 overflow-auto border-t px-3 py-2 font-mono text-xs break-words whitespace-pre-wrap text-foreground">
            {devDetail}
          </pre>
        </details>
      ) : null}
    </div>
  );

  if (isRegion) return body;
  if (variant === 'screen') {
    return (
      <div className="flex h-dvh w-full overflow-y-auto bg-background p-4 sm:p-8">
        <div className="m-auto w-full max-w-md">{body}</div>
      </div>
    );
  }
  return (
    <div className="flex min-h-[60dvh] w-full flex-1 p-4 sm:p-8">
      <div className="m-auto w-full max-w-md">{body}</div>
    </div>
  );
}
