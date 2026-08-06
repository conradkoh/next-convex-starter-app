'use client';

import { CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface CallbackSuccessCardProps {
  flowType?: 'login' | 'connect';
  autoCloseDelay?: number;
  onClose?: () => void;
  redirectTo?: string;
  userName?: string;
}

/**
 * Displays OAuth callback success with automatic window closure and countdown timer.
 */
export function CallbackSuccessCard({
  flowType = 'login',
  autoCloseDelay = 3,
  onClose,
  redirectTo,
  userName,
}: CallbackSuccessCardProps) {
  const [countdown, setCountdown] = useState(autoCloseDelay);
  const isRedirectMode = typeof window !== 'undefined' && !!redirectTo && !window.opener;

  useEffect(() => {
    if (countdown <= 0) {
      // fallow-ignore-next-line complexity
      const timer = setTimeout(() => {
        if (onClose) {
          onClose();
        } else if (redirectTo && typeof window !== 'undefined' && !window.opener) {
          window.location.assign(redirectTo);
        } else {
          window.close();
        }
      }, 500);

      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onClose, redirectTo]);

  const successMessage = _getSuccessMessage(flowType, userName);
  const countdownLabel = isRedirectMode ? 'Redirecting' : 'Closing';

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center space-y-3">
        <CheckCircle className="mx-auto h-10 w-10 text-green-600" />
        <p className="text-sm font-medium">{successMessage}</p>
        <p className="text-xs text-muted-foreground">
          {countdownLabel} in {countdown}s…
        </p>
      </div>
    </div>
  );
}

function _getSuccessMessage(flowType: 'login' | 'connect', userName?: string): string {
  if (flowType === 'connect') {
    return userName
      ? `Google account connected successfully for ${userName}!`
      : 'Google account connected successfully!';
  }

  return userName ? `Welcome back, ${userName}!` : 'Sign in successful!';
}
