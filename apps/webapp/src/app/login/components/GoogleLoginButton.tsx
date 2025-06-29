'use client';

import { Button } from '@/components/ui/button';
import { useGoogleAuthAvailable } from '@/modules/app/useAppInfo';
import { api } from '@workspace/backend/convex/_generated/api';
import { useAction } from 'convex/react';
import { useState } from 'react';
import { toast } from 'sonner';

interface GoogleLoginButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  redirectUri?: string;
}

export const GoogleLoginButton = ({
  className = 'w-full',
  variant = 'outline',
  redirectUri = `${window.location.origin}/login/google/callback`,
}: GoogleLoginButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const googleAuthAvailable = useGoogleAuthAvailable();
  const generateGoogleAuthUrl = useAction(api.googleAuth.generateGoogleAuthUrl);

  // Generate CSRF state parameter
  const generateState = (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  };

  const handleGoogleLogin = async () => {
    // Check if Google auth is enabled
    if (!googleAuthAvailable) {
      toast.error('Google authentication is currently disabled or not configured');
      return;
    }

    setIsLoading(true);
    try {
      // Generate CSRF state and store it
      const state = generateState();
      sessionStorage.setItem('google_oauth_state', state);

      // Generate Google auth URL
      const result = await generateGoogleAuthUrl({
        redirectUri,
        state,
      });

      // Redirect to Google
      window.location.href = result.authUrl;
    } catch (error) {
      console.error('Failed to initiate Google login:', error);
      toast.error('Failed to start Google login. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      onClick={handleGoogleLogin}
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
          <GoogleIcon className="mr-2 h-4 w-4" />
          Continue with Google
        </>
      )}
    </Button>
  );
};

// Google icon component
const GoogleIcon = ({ className }: { className?: string }) => (
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
