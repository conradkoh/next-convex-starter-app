'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import { useAction } from 'convex/react';
import { useSessionId } from 'convex-helpers/react/sessions';
import { CopyIcon, RefreshCw } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export function ProfileSettings() {
  return (
    <section aria-labelledby="profile-settings-heading" className="space-y-6">
      <div>
        <h2 id="profile-settings-heading" className="text-xl font-semibold">
          Account recovery
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage recovery options for your account. Keep your recovery code in a safe place; it is
          the only way to regain access to your anonymous account if you lose access.
        </p>
      </div>
      <RecoveryCodeSection />
    </section>
  );
}

/**
 * Displays recovery code management section for account backup and restoration.
 */
// fallow-ignore-next-line complexity
function RecoveryCodeSection() {
  const getOrCreateCode = useAction(api.auth.getOrCreateRecoveryCode);
  const regenerateCode = useAction(api.auth.regenerateRecoveryCode);
  const [sessionId] = useSessionId();

  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleRevealCode = useCallback(async () => {
    await _handleRevealCode({
      sessionId,
      setError,
      setIsLoading,
      getOrCreateCode,
      setRecoveryCode,
    });
  }, [sessionId, getOrCreateCode]);

  const handleRegenerateCode = useCallback(async () => {
    await _handleRegenerateCode({
      sessionId,
      setIsRegenerating,
      setError,
      regenerateCode,
      setRecoveryCode,
      setDialogOpen,
    });
  }, [sessionId, regenerateCode]);

  const handleCopyCode = useCallback(() => {
    _handleCopyCode(recoveryCode);
  }, [recoveryCode]);

  const handleTextareaClick = useCallback((e: React.MouseEvent<HTMLTextAreaElement>) => {
    // Select all text when clicked for easy copying
    e.currentTarget.select();
  }, []);

  const buttonText = useMemo(() => {
    return isLoading ? 'Revealing...' : 'Reveal Recovery Code';
  }, [isLoading]);

  const regenerateButtonText = useMemo(() => {
    return isRegenerating ? 'Regenerating...' : 'Regenerate Code';
  }, [isRegenerating]);

  return (
    <div className="mt-6 border-t pt-6">
      {!recoveryCode ? (
        <Button onClick={handleRevealCode} disabled={isLoading}>
          {buttonText}
        </Button>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Textarea
              value={recoveryCode}
              readOnly
              className="h-auto min-h-[100px] resize-none whitespace-normal break-all font-mono text-sm"
              onClick={handleTextareaClick}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCode}
              aria-label="Copy recovery code"
              title="Copy to clipboard"
              className="self-end"
            >
              <CopyIcon className="mr-2 h-4 w-4" />
              Copy Code
            </Button>
          </div>

          <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <AlertDialogTrigger
              className={cn(buttonVariants({ variant: 'outline' }), 'flex items-center gap-2')}
              disabled={isRegenerating}
            >
              <RefreshCw className="h-4 w-4" />
              {regenerateButtonText}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  Regenerating your recovery code will{' '}
                  <span className="font-bold text-destructive">invalidate your old code</span>. This
                  action cannot be undone. Your old recovery code will no longer work!
                  <br />
                  <br />
                  Make sure to save your new code in a secure location after regenerating.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRegenerateCode}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Regenerate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}

interface _RevealCodeParams {
  sessionId: ReturnType<typeof useSessionId>[0];
  setError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  getOrCreateCode: ReturnType<typeof useAction<typeof api.auth.getOrCreateRecoveryCode>>;
  setRecoveryCode: (code: string | null) => void;
}

/**
 * Handles revealing the recovery code with proper error handling.
 */
// fallow-ignore-next-line complexity
async function _handleRevealCode(params: _RevealCodeParams): Promise<void> {
  const { sessionId, setError, setIsLoading, getOrCreateCode, setRecoveryCode } = params;

  if (!sessionId) {
    setError('Session not found. Cannot fetch recovery code.');
    toast.error('Session not found.');
    return;
  }

  setIsLoading(true);
  setError(null);

  try {
    const result = await getOrCreateCode({ sessionId });
    if (result.success && result.recoveryCode) {
      setRecoveryCode(result.recoveryCode);
    } else {
      setError(result.reason || 'Failed to retrieve recovery code.');
      toast.error(result.reason || 'Failed to retrieve recovery code.');
    }
  } catch (error) {
    console.error('Error revealing recovery code:', error);
    setError('An unexpected error occurred.');
    toast.error('An unexpected error occurred.');
  } finally {
    setIsLoading(false);
  }
}

interface _RegenerateCodeParams {
  sessionId: ReturnType<typeof useSessionId>[0];
  setIsRegenerating: (regenerating: boolean) => void;
  setError: (error: string | null) => void;
  regenerateCode: ReturnType<typeof useAction<typeof api.auth.regenerateRecoveryCode>>;
  setRecoveryCode: (code: string | null) => void;
  setDialogOpen: (open: boolean) => void;
}

/**
 * Handles regenerating the recovery code with confirmation and error handling.
 */
// fallow-ignore-next-line complexity
async function _handleRegenerateCode(params: _RegenerateCodeParams): Promise<void> {
  const { sessionId, setIsRegenerating, setError, regenerateCode, setRecoveryCode, setDialogOpen } =
    params;

  if (!sessionId) {
    setError('Session not found. Cannot regenerate recovery code.');
    toast.error('Session not found.');
    return;
  }

  setIsRegenerating(true);
  setError(null);

  try {
    const result = await regenerateCode({ sessionId });
    if (result.success && result.recoveryCode) {
      setRecoveryCode(result.recoveryCode);
      toast.success('Recovery code regenerated successfully!');
    } else {
      setError(result.reason || 'Failed to regenerate recovery code.');
      toast.error(result.reason || 'Failed to regenerate recovery code.');
    }
  } catch (error) {
    console.error('Error regenerating recovery code:', error);
    setError('An unexpected error occurred.');
    toast.error('An unexpected error occurred.');
  } finally {
    setIsRegenerating(false);
    setDialogOpen(false);
  }
}

/**
 * Handles copying the recovery code to clipboard with user feedback.
 */
function _handleCopyCode(recoveryCode: string | null): void {
  if (recoveryCode) {
    navigator.clipboard
      .writeText(recoveryCode)
      .then(() => {
        toast.success('Recovery code copied to clipboard!');
      })
      .catch((error) => {
        console.error('Failed to copy text: ', error);
        toast.error('Failed to copy code.');
      });
  }
}
