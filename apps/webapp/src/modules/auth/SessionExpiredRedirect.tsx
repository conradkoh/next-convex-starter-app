'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Transitional state for NOT_AUTHENTICATED: polite status + redirect; the anchor works without the router. */
export function SessionExpiredRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div role="status" className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Your session has expired. Redirecting to sign in…
        </p>
        <a
          href="/login"
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Sign in now
        </a>
      </div>
    </div>
  );
}
