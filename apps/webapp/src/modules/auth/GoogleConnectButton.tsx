'use client';

import { Button } from '@/components/ui/button';
import { useGoogleAuthAvailable } from '@/modules/app/useAppInfo';
import { api } from '@workspace/backend/convex/_generated/api';
import { useAction } from 'convex/react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export interface GoogleConnectButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  onConnectStart?: () => void;
  onConnectComplete?: () => void;
}

interface _GoogleIconProps {
  className?: string;
}

/**
 * Google connect button component for linking Google accounts to existing users.
 * Handles Google OAuth flow specifically for account linking (not login).
 */
export const GoogleConnectButton = ({
  className = '',
  variant = 'outline',
  onConnectStart,
  onConnectComplete,
}: GoogleConnectButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const googleAuthAvailable = useGoogleAuthAvailable();
  const generateGoogleAuthUrl = useAction(api.googleAuth.generateGoogleAuthUrl);

  /**
   * Handles Google connect button click and initiates OAuth flow.
   */
  const handleGoogleConnect = useCallback(async () => {
    // Check if Google auth is enabled
    if (!googleAuthAvailable) {
      toast.error('Google authentication is currently disabled or not configured');
      return;
    }

    setIsLoading(true);
    onConnectStart?.();

    try {
      // Clean up any previous state/flags
      sessionStorage.removeItem('google_oauth_connect_state');
      sessionStorage.removeItem('google_oauth_connect_processed');
      sessionStorage.removeItem('google_oauth_connect_in_progress');

      // Generate CSRF state and store it with a different key than login
      const state = _generateState();
      sessionStorage.setItem('google_oauth_connect_state', state);

      // Generate Google auth URL with connect-specific redirect URI
      const redirectUri = `${window.location.origin}/app/profile/connect/google/callback`;
      const result = await generateGoogleAuthUrl({
        redirectUri,
        state,
      });

      // Redirect to Google
      window.location.href = result.authUrl;
    } catch (error) {
      console.error('Failed to initiate Google connect:', error);
      toast.error('Failed to start Google connection. Please try again.');
      setIsLoading(false);
      onConnectComplete?.();
    }
  }, [googleAuthAvailable, generateGoogleAuthUrl, onConnectStart, onConnectComplete]);

  return (
    <Button
      variant={variant}
      onClick={handleGoogleConnect}
      disabled={isLoading || !googleAuthAvailable}
      className={className}
    >
      {isLoading ? (
        <>
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Connecting to Google...
        </>
      ) : (
        <>
          <_GoogleIcon className="mr-2 h-4 w-4" />
          Connect Google
        </>
      )}
    </Button>
  );
};

/**
 * Generates a cryptographically secure random state for CSRF protection.
 */
function _generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Google brand icon component with proper SVG paths.
 */
function _GoogleIcon({ className }: _GoogleIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <title>Google</title>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
