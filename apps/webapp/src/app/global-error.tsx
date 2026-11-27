'use client';

import './globals.css';
import { useEffect } from 'react';

import { reportError } from '@/lib/errors';
import { AppUnavailable } from '@/modules/errors/AppUnavailable';

// Self-contained on purpose: no imports or closures, because it is also serialised into an inline <script>.
// fallow-ignore-next-line complexity
function applyStoredTheme() {
  try {
    const stored = localStorage.getItem('theme') || 'system';
    const dark =
      stored === 'dark' ||
      (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  } catch {
    /* storage unavailable: keep light */
  }
}
const THEME_SCRIPT = `(${applyStoredTheme.toString()})()`;

/** Replaces the root layout on a root-level crash: own <html>/<body>, no providers. */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    applyStoredTheme();
    reportError({ error, scope: 'global', digest: error.digest });
  }, [error]);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="bg-background font-[family-name:ui-sans-serif,system-ui,sans-serif] text-foreground antialiased">
        <AppUnavailable error={error} />
      </body>
    </html>
  );
}
