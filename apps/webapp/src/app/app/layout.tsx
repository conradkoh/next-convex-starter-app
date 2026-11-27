'use client';

import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

import { RequireLogin } from '@/modules/auth/RequireLogin';

/**
 * Loading fallback for Suspense boundary.
 */
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Authenticated application layout.
 * 1. RequireLogin - primary auth gate (UnauthorizedPage when logged out)
 * 2. Suspense - loading state while content loads
 * Render failures (including a stale session, NOT_AUTHENTICATED) are handled by the nearest
 * error.tsx via RouteError, which redirects expired sessions to /login.
 */
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RequireLogin>
      <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
    </RequireLogin>
  );
}
