'use client';
import { UnauthorizedPage } from '@/components/UnauthorizedPage';
import { useAuthState } from '@/lib/auth/AuthProvider';
import { Loader2 } from 'lucide-react';

export const RequireLogin = ({ children }: { children: React.ReactNode }) => {
  const authState = useAuthState();

  if (!authState) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (authState.state === 'unauthenticated') {
    return <UnauthorizedPage />;
  }

  return <>{children}</>;
};
