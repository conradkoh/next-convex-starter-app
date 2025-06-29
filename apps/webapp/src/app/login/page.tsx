'use client';

import { Button } from '@/components/ui/button';
import { useAuthState } from '@/lib/auth/AuthProvider';
import { useGoogleAuthAvailable } from '@/modules/app/useAppInfo';
import { featureFlags } from '@workspace/backend/config/featureFlags';
import { AlertCircle, ChevronRight, KeyRound, KeySquare, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnonymousLoginButton } from './components/AnonymousLoginButton';
import { GoogleLoginButton } from './components/GoogleLoginButton';

export default function LoginPage() {
  const router = useRouter();
  const authState = useAuthState();
  const googleAuthAvailable = useGoogleAuthAvailable();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const isLoading = authState === undefined;

  // Get session ID for anonymous login - moved to useEffect to avoid hydration mismatch
  useEffect(() => {
    setSessionId(localStorage.getItem('sessionId'));
  }, []);

  // Redirect authenticated users to app
  useEffect(() => {
    if (authState?.state === 'authenticated') {
      router.push('/app');
    }
  }, [authState, router]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </main>
    );
  }

  // Show disabled state when login is disabled
  if (featureFlags.disableLogin) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
        <div className="w-full max-w-md space-y-6">
          <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
            <div className="space-y-6 text-center">
              <div className="space-y-2">
                <AlertCircle className="mx-auto h-16 w-16 text-muted-foreground/60" />
                <h1 className="text-2xl font-semibold">Login Disabled</h1>
                <p className="text-muted-foreground">
                  Login functionality has been disabled for this application.
                </p>
              </div>

              <div className="pt-4">
                <Link href="/">
                  <Button variant="outline" className="w-full cursor-pointer">
                    Return to Home
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-sm text-muted-foreground">Choose how you'd like to sign in</p>
        </div>

        {/* Login Options List */}
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="divide-y divide-border">
            {/* Google Login */}
            {googleAuthAvailable && <GoogleLoginButton variant="ghost" showChevron={true} />}

            {/* Login with Code */}
            <Link href="/login/code" className="block">
              <div className="flex items-center justify-between h-16 px-6 hover:bg-muted/50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8">
                    <KeyRound className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-left">Enter Login Code</span>
                    <span className="text-sm text-muted-foreground text-left">
                      Use a code from your other device
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </Link>

            {/* Anonymous Login */}
            {sessionId && <AnonymousLoginButton sessionId={sessionId} variant="list" />}
          </div>

          {/* Recovery Section */}
          <div className="border-t border-border">
            <Link href="/recover" className="block">
              <div className="flex items-center justify-between h-14 px-6 hover:bg-muted/30 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8">
                    <KeySquare className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    Lost access to your account?
                  </span>
                </div>
                <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </Link>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-xs text-muted-foreground">
          <p>By signing in, you agree to our terms of service</p>
        </div>
      </div>
    </main>
  );
}
