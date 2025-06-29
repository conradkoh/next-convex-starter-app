'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import { useSessionAction, useSessionMutation } from 'convex-helpers/react/sessions';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface GoogleCallbackProps {
  redirectPath?: string;
}

export const GoogleCallback = ({ redirectPath = '/app' }: GoogleCallbackProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const exchangeGoogleCode = useSessionAction(api.googleAuth.exchangeGoogleCode);
  const loginWithGoogle = useSessionMutation(api.googleAuth.loginWithGoogle);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get parameters from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        // Handle OAuth error
        if (error) {
          console.error('Google OAuth error:', error);
          const errorDescription =
            searchParams.get('error_description') || 'Google authentication failed';
          setError(errorDescription);
          toast.error(`Authentication failed: ${errorDescription}`);
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        // Validate required parameters
        if (!code || !state) {
          setError('Missing required OAuth parameters');
          toast.error('Invalid callback parameters');
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        // Validate CSRF state
        const storedState = sessionStorage.getItem('google_oauth_state');
        if (!storedState || storedState !== state) {
          setError('Invalid state parameter - possible CSRF attack');
          toast.error('Security validation failed');
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        // Clean up stored state
        sessionStorage.removeItem('google_oauth_state');

        // Exchange code for profile
        const redirectUri = `${window.location.origin}/login/google/callback`;
        const exchangeResult = await exchangeGoogleCode({
          code,
          state,
          redirectUri,
        });

        if (!exchangeResult.success || !exchangeResult.profile) {
          throw new Error('Failed to exchange code for profile');
        }

        // Login with Google profile
        const loginResult = await loginWithGoogle({
          profile: exchangeResult.profile,
        });

        if (!loginResult.success) {
          throw new Error('Failed to complete Google login');
        }

        // Success!
        toast.success(`Welcome, ${exchangeResult.profile.name}!`);
        router.push(redirectPath);
      } catch (error) {
        console.error('Google callback error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
        setError(errorMessage);
        toast.error(errorMessage);
        setTimeout(() => router.push('/login'), 2000);
      } finally {
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [searchParams, exchangeGoogleCode, loginWithGoogle, router, redirectPath]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="space-y-2">
            <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <title>Error</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Authentication Failed</h1>
            <p className="text-gray-600">{error}</p>
          </div>
          <p className="text-sm text-gray-500">Redirecting you back to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-gray-900">Completing Sign In</h1>
            <p className="text-gray-600">
              {isProcessing
                ? 'Please wait while we complete your Google authentication...'
                : 'Authentication complete!'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
