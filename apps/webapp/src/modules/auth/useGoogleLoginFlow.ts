'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import type { Id } from '@workspace/backend/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { useSessionMutation } from 'convex-helpers/react/sessions';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { buildGoogleOAuthUrl, createOAuthState, launchGoogleOAuth } from './google-oauth';

import { useGoogleAuthAvailable } from '@/modules/app/useAppInfo';

// fallow-ignore-next-line complexity
export function useGoogleLoginFlow(returnTo?: string | null) {
  const [isLoading, setIsLoading] = useState(false);
  const [loginRequestId, setLoginRequestId] = useState<Id<'auth_loginRequests'> | null>(null);
  const router = useRouter();
  const googleAuthAvailable = useGoogleAuthAvailable();
  const googleConfig = useQuery(api.auth.google.getConfig);
  const createLoginRequest = useSessionMutation(api.auth.google.createLoginRequest);

  const loginStatusRef = useRef<string | undefined>(undefined);

  const loginRequest = useQuery(
    api.auth.google.getLoginRequest,
    loginRequestId ? { loginRequestId } : 'skip'
  );

  loginStatusRef.current = loginRequest?.status;

  // React to terminal login request status
  // fallow-ignore-next-line complexity
  useEffect(() => {
    if (!loginRequest || !isLoading) return;

    if (loginRequest.status === 'completed') {
      setIsLoading(false);
      setLoginRequestId(null);
      toast.success('Login successful!');
      router.push(returnTo || '/app');
    } else if (loginRequest.status === 'failed') {
      setIsLoading(false);
      setLoginRequestId(null);
      toast.error(loginRequest.error || 'Login failed');
    }
  }, [loginRequest, isLoading, router, returnTo]);

  // fallow-ignore-next-line complexity
  const startGoogleLogin = useCallback(async () => {
    if (!googleAuthAvailable || !googleConfig?.clientId) {
      toast.error('Google authentication is currently disabled or not configured');
      return;
    }

    setIsLoading(true);
    try {
      const redirectUri = `${window.location.origin}/api/auth/google/callback`;
      const result = await createLoginRequest({ redirectUri });
      setLoginRequestId(result.loginId);

      const returnPath = returnTo || '/app';
      const state = createOAuthState('login', result.loginId, returnPath);
      const authUrl = buildGoogleOAuthUrl({
        clientId: googleConfig.clientId,
        redirectUri,
        state,
      });

      const mode = launchGoogleOAuth({
        authUrl,
        popupName: 'google-oauth',
        onPopupClosed: () => {
          if (loginStatusRef.current === 'pending') {
            setIsLoading(false);
            setLoginRequestId(null);
          }
        },
        onPopupTimeout: () => {
          toast.error('Login timeout. Please try again.');
          setIsLoading(false);
          setLoginRequestId(null);
        },
      });

      if (mode === 'redirect') return;
    } catch {
      toast.error('Failed to start Google login. Please try again.');
      setIsLoading(false);
      setLoginRequestId(null);
    }
  }, [googleAuthAvailable, googleConfig, createLoginRequest, returnTo]);

  return {
    startGoogleLogin,
    isLoading,
    isAvailable: !!googleAuthAvailable,
  };
}
