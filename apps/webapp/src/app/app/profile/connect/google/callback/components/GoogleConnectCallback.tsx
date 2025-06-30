'use client';

import { useAuthState } from '@/modules/auth/AuthProvider';
import { api } from '@workspace/backend/convex/_generated/api';
import { useSessionMutation } from 'convex-helpers/react/sessions';
import { useAction } from 'convex/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface _OAuthValidationResult {
  isValid: boolean;
  error?: string;
}

interface _CSRFValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Google Connect Callback component for handling OAuth callback during account linking.
 * This component processes the OAuth callback and connects the Google account to the current user.
 */
export const GoogleConnectCallback = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authState = useAuthState();

  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convex functions
  const exchangeGoogleCode = useAction(api.googleAuth.exchangeGoogleCode);
  const connectGoogle = useSessionMutation(api.googleAuth.connectGoogle);

  /**
   * Processes the OAuth callback with comprehensive error handling.
   */
  const processCallback = useCallback(async () => {
    try {
      // Check if user is logged in
      if (authState?.state !== 'authenticated') {
        _handleError('You must be logged in to connect a Google account', router);
        return;
      }

      // Validate OAuth parameters
      const validation = _validateOAuthParameters(searchParams);
      if (!validation.isValid) {
        _handleError(validation.error || 'Validation failed', router);
        return;
      }

      const code = searchParams.get('code');
      const state = searchParams.get('state');

      // These should be valid at this point due to validation above
      if (!code || !state) {
        _handleError('Missing required parameters after validation', router);
        return;
      }

      // Validate CSRF state (more robust for React StrictMode)
      const stateValidation = await _validateCSRFStateRobust(state);
      if (!stateValidation.isValid) {
        // Check if this is a harmless duplicate execution
        if (
          stateValidation.error === 'OAuth callback already processed' ||
          stateValidation.error === 'Already processing'
        ) {
          // Silently ignore duplicate executions in React StrictMode
          console.log('Ignoring duplicate OAuth callback execution:', stateValidation.error);
          setIsProcessing(false);
          return;
        }
        _handleError(
          stateValidation.error || 'Invalid state parameter - possible CSRF attack',
          router
        );
        return;
      }

      console.log('Starting Google OAuth token exchange for connect...');
      // Exchange code for profile
      const redirectUri = `${window.location.origin}/app/profile/connect/google/callback`;
      const exchangeResult = await exchangeGoogleCode({
        code,
        state,
        redirectUri,
      });

      if (!exchangeResult.success || !exchangeResult.profile) {
        throw new Error('Failed to exchange code for profile');
      }

      console.log('Token exchange successful, connecting Google profile...');
      // Connect Google profile to current user
      const connectResult = await connectGoogle({
        profile: exchangeResult.profile,
      });

      if (!connectResult.success) {
        throw new Error('Failed to connect Google account');
      }

      console.log('Google connect successful, redirecting...');
      // Clean up session storage and mark as successfully processed
      sessionStorage.removeItem('google_oauth_connect_in_progress');
      sessionStorage.setItem('google_oauth_connect_processed', 'true');
      // Success!
      toast.success('Google account connected successfully!');
      setIsProcessing(false); // Only set to false on success
      router.push('/app/profile');
    } catch (error) {
      console.error('Google connect callback error:', error);

      // Handle specific error cases
      let errorMessage = 'Failed to connect Google account';

      if (error instanceof Error) {
        // Check for specific Convex error patterns
        if (error.message.includes('ALREADY_CONNECTED')) {
          errorMessage = 'This Google account is already connected to your account';
        } else if (error.message.includes('GOOGLE_ACCOUNT_IN_USE')) {
          errorMessage = 'This Google account is already connected to another user';
        } else if (error.message.includes('EMAIL_ALREADY_EXISTS')) {
          errorMessage = 'Another user account already uses this email address';
        } else {
          errorMessage = error.message;
        }
      }

      _handleError(errorMessage, router);
    }
  }, [searchParams, exchangeGoogleCode, connectGoogle, router, authState]);

  /**
   * Handles navigation back to profile page.
   */
  const handleReturnToProfile = useCallback(() => {
    router.push('/app/profile');
  }, [router]);

  // Process callback on mount
  useEffect(() => {
    processCallback();
  }, [processCallback]);

  // Show loading state while processing
  if (isProcessing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-gray-900">Connecting Google Account</h1>
              <p className="text-gray-600">Please wait while we link your Google account...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if processing failed
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
              <div className="h-8 w-8 text-red-600">✕</div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-red-900">Connection Failed</h1>
              <p className="text-red-600">{error}</p>
              <button
                type="button"
                onClick={handleReturnToProfile}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Return to Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

/**
 * Validates OAuth callback parameters for proper structure and error handling.
 */
function _validateOAuthParameters(searchParams: URLSearchParams): _OAuthValidationResult {
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Check for OAuth errors first
  if (error) {
    const errorDescription = searchParams.get('error_description');
    return {
      isValid: false,
      error: `Google OAuth error: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`,
    };
  }

  // Check for required parameters
  if (!code) {
    return {
      isValid: false,
      error: 'Missing authorization code from Google',
    };
  }

  if (!state) {
    return {
      isValid: false,
      error: 'Missing state parameter - possible security issue',
    };
  }

  return { isValid: true };
}

/**
 * Validates CSRF state parameter using simple comparison.
 */
async function _validateCSRFState(state: string): Promise<boolean> {
  try {
    const storedState = sessionStorage.getItem('google_oauth_connect_state');
    return storedState === state;
  } catch (error) {
    console.error('Failed to validate CSRF state:', error);
    return false;
  }
}

/**
 * Validates CSRF state parameter more robustly for React StrictMode.
 * Uses a processed flag to prevent double execution issues.
 */
async function _validateCSRFStateRobust(state: string): Promise<_CSRFValidationResult> {
  try {
    const storedState = sessionStorage.getItem('google_oauth_connect_state');
    const processedFlag = sessionStorage.getItem('google_oauth_connect_processed');
    const inProgressFlag = sessionStorage.getItem('google_oauth_connect_in_progress');

    // If already processed, don't process again (React StrictMode protection)
    if (processedFlag === 'true') {
      return { isValid: false, error: 'OAuth callback already processed' };
    }

    // If currently in progress, don't start another one
    if (inProgressFlag === 'true') {
      return { isValid: false, error: 'Already processing' };
    }

    if (storedState === state) {
      // Mark as in progress first to prevent concurrent processing
      sessionStorage.setItem('google_oauth_connect_in_progress', 'true');
      // Clean up the state after successful validation
      sessionStorage.removeItem('google_oauth_connect_state');
      return { isValid: true };
    }

    return { isValid: false, error: 'Invalid CSRF state' };
  } catch (error) {
    console.error('Failed to validate CSRF state:', error);
    return { isValid: false, error: 'Failed to validate CSRF state' };
  }
}

/**
 * Handles errors with user feedback and navigation cleanup.
 */
function _handleError(message: string, router: ReturnType<typeof useRouter>): void {
  console.error('Google connect error:', message);
  toast.error(message);

  // Clean up all session storage flags
  sessionStorage.removeItem('google_oauth_connect_state');
  sessionStorage.removeItem('google_oauth_connect_processed');
  sessionStorage.removeItem('google_oauth_connect_in_progress');

  // Navigate back to profile page after a short delay
  setTimeout(() => {
    router.push('/app/profile');
  }, 2000);
}
