'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthState } from '@/modules/auth/AuthProvider';
import { GoogleConnectButton } from '@/modules/auth/GoogleConnectButton';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { api } from '@workspace/backend/convex/_generated/api';
import { useSessionMutation } from 'convex-helpers/react/sessions';
import { X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface _DisconnectDialogState {
  isOpen: boolean;
  providerId: string;
  providerName: string;
  isDisconnecting: boolean;
}

/**
 * Name edit form component allowing users to update their display name.
 * Supports different user types (Google, anonymous, full account) with appropriate messaging.
 */
export function NameEditForm() {
  const authState = useAuthState();
  const updateUserName = useSessionMutation(api.auth.updateUserName);
  const disconnectGoogle = useSessionMutation(api.googleAuth.disconnectGoogle);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(authState?.state === 'authenticated' ? authState.user.name : '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for disconnect confirmation dialog
  const [disconnectDialog, setDisconnectDialog] = useState<_DisconnectDialogState>({
    isOpen: false,
    providerId: '',
    providerName: '',
    isDisconnecting: false,
  });

  /**
   * Memoized user data to prevent unnecessary re-renders.
   */
  const currentUser = useMemo(() => {
    return authState?.state === 'authenticated' ? authState.user : null;
  }, [authState]);

  /**
   * Handles form submission to update the user's display name.
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!name.trim()) {
        setError('Name cannot be empty');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await updateUserName({
          newName: name,
        });

        if (result.success) {
          toast.success(result.message);
          setIsEditing(false);
        } else {
          setError(result.message);
          toast.error(result.message);
        }
      } catch (error) {
        console.error('Failed to update name:', error);
        setError('An unexpected error occurred. Please try again.');
        toast.error('Failed to update name. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [name, updateUserName]
  );

  /**
   * Handles canceling the edit operation and resets the form.
   */
  const handleCancel = useCallback(() => {
    setName(authState?.state === 'authenticated' ? authState.user.name : '');
    setError(null);
    setIsEditing(false);
  }, [authState]);

  /**
   * Starts the editing mode.
   */
  const startEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  /**
   * Handles input changes for the name field.
   */
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  }, []);

  /**
   * Shows disconnect confirmation dialog for a provider.
   */
  const showDisconnectConfirmation = useCallback((providerId: string, providerName: string) => {
    setDisconnectDialog({
      isOpen: true,
      providerId,
      providerName,
      isDisconnecting: false,
    });
  }, []);

  /**
   * Handles confirmed disconnect for a provider.
   */
  const confirmDisconnectProvider = useCallback(
    async (providerId: string) => {
      if (providerId !== 'google') {
        toast.error('Only Google disconnect is currently supported');
        return;
      }

      setDisconnectDialog((prev) => ({ ...prev, isDisconnecting: true }));

      try {
        const result = await disconnectGoogle();
        if (result.success) {
          toast.success(result.message);
          setDisconnectDialog({
            isOpen: false,
            providerId: '',
            providerName: '',
            isDisconnecting: false,
          });
        } else {
          toast.error('Failed to disconnect Google account');
        }
      } catch (error) {
        console.error('Failed to disconnect Google account:', error);
        toast.error('Failed to disconnect Google account. Please try again.');
      } finally {
        setDisconnectDialog((prev) => ({ ...prev, isDisconnecting: false }));
      }
    },
    [disconnectGoogle]
  );

  /**
   * Handles dialog open/close state changes.
   */
  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!disconnectDialog.isDisconnecting) {
        setDisconnectDialog((prev) => ({ ...prev, isOpen: open }));
      }
    },
    [disconnectDialog.isDisconnecting]
  );

  /**
   * Handles disconnect action click.
   */
  const handleDisconnectClick = useCallback(() => {
    confirmDisconnectProvider(disconnectDialog.providerId);
  }, [confirmDisconnectProvider, disconnectDialog.providerId]);

  if (!currentUser) {
    return null;
  }

  return (
    <div className="space-y-6">
      {_renderHeader(isEditing, startEditing)}
      {isEditing
        ? _renderEditForm(name, error, isLoading, handleNameChange, handleSubmit, handleCancel)
        : _renderDisplayView(currentUser, showDisconnectConfirmation)}

      {/* Disconnect confirmation dialog */}
      <AlertDialog open={disconnectDialog.isOpen} onOpenChange={handleDialogOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {disconnectDialog.providerName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect your {disconnectDialog.providerName} account? You
              can reconnect it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disconnectDialog.isDisconnecting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnectClick}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={disconnectDialog.isDisconnecting}
            >
              {disconnectDialog.isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// 5. Internal helper functions
/**
 * Renders the section header with edit button.
 */
function _renderHeader(isEditing: boolean, startEditing: () => void) {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold">Your Display Name</h2>
      {!isEditing && (
        <Button variant="outline" size="sm" onClick={startEditing}>
          Edit Name
        </Button>
      )}
    </div>
  );
}

/**
 * Renders the display view showing current user information.
 */
function _renderDisplayView(
  user: NonNullable<
    Extract<NonNullable<ReturnType<typeof useAuthState>>, { state: 'authenticated' }>['user']
  >,
  showDisconnectConfirmation: (providerId: string, providerName: string) => void
) {
  return (
    <div className="p-4 bg-secondary/50 rounded-md">
      <div className="flex items-center space-x-3">
        {_renderUserAvatar(user)}
        <div className="flex-1">
          <p className="font-medium">{user.name}</p>
          {_renderUserTypeInfo(user, showDisconnectConfirmation)}
        </div>
      </div>
    </div>
  );
}

/**
 * Renders the user avatar if available (from any linked account).
 */
function _renderUserAvatar(user: { type: string; google?: { picture?: string }; name: string }) {
  // Check for profile picture from any linked account
  const profilePicture = user.google?.picture;

  if (profilePicture) {
    return (
      <img src={profilePicture} alt={`${user.name}'s profile`} className="w-12 h-12 rounded-full" />
    );
  }
  return null;
}

/**
 * Renders user type-specific information.
 */
function _renderUserTypeInfo(
  user: { type: string; email?: string; google?: { email?: string } },
  showDisconnectConfirmation: (providerId: string, providerName: string) => void
) {
  const authState = useAuthState();
  const authMethod = authState?.state === 'authenticated' ? authState.authMethod : undefined;

  return (
    <div className="mt-3 space-y-4">
      {/* Show email if available */}
      {user.email && (
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">Email:</span> {user.email}
        </div>
      )}

      {/* Show current session info subtly */}
      {authMethod && _renderSessionInfo(authMethod)}

      {/* Third-party accounts section */}
      {_renderThirdPartyAccounts(user, showDisconnectConfirmation)}

      {/* Show user type specific info */}
      {_renderUserTypeSpecificInfo(user)}
    </div>
  );
}

/**
 * Renders subtle session information.
 */
function _renderSessionInfo(authMethod: string) {
  const sessionLabels = {
    google: 'Active Google session',
    login_code: 'Signed in with code',
    recovery_code: 'Signed in with recovery code',
    anonymous: 'Anonymous session',
    username_password: 'Password session',
  };

  const label = sessionLabels[authMethod as keyof typeof sessionLabels];

  if (!label) return null;

  return <div className="text-xs text-muted-foreground/70">{label}</div>;
}

/**
 * Renders third-party authentication accounts section.
 */
function _renderThirdPartyAccounts(
  user: { google?: { email?: string } },
  showDisconnectConfirmation: (providerId: string, providerName: string) => void
) {
  const googleProvider = useMemo(
    () => ({
      id: 'google',
      name: 'Google',
      icon: _renderGoogleIcon(),
      isConnected: !!user.google,
      connectedEmail: user.google?.email,
    }),
    [user]
  );

  const handleDisconnectClick = useCallback(() => {
    showDisconnectConfirmation(googleProvider.id, googleProvider.name);
  }, [showDisconnectConfirmation, googleProvider.id, googleProvider.name]);

  return (
    <div className="border-t pt-4">
      <h3 className="text-sm font-medium text-foreground mb-3">Connected Accounts</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            {googleProvider.icon}
            <span className="text-sm font-medium">{googleProvider.name}</span>
          </div>

          <div className="flex items-center gap-3">
            {googleProvider.isConnected ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>
                      Connected
                      {googleProvider.connectedEmail && (
                        <span className="ml-1">({googleProvider.connectedEmail})</span>
                      )}
                    </span>
                    <ChevronDownIcon className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleDisconnectClick}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-muted-foreground/30 rounded-full" />
                  <span className="text-xs text-muted-foreground">Not connected</span>
                </div>
                <GoogleConnectButton variant="outline" className="text-xs h-auto px-3 py-1" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders user type specific information.
 */
function _renderUserTypeSpecificInfo(user: { type: string }) {
  if (user.type === 'anonymous') {
    return (
      <div className="text-sm text-muted-foreground bg-muted/30 rounded-md p-3">
        <p>Personalize your account by updating your display name above.</p>
      </div>
    );
  }

  return null;
}

/**
 * Renders the Google brand icon with improved styling.
 */
function _renderGoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
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

/**
 * Renders the edit form for updating the display name.
 */
function _renderEditForm(
  name: string,
  error: string | null,
  isLoading: boolean,
  handleNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  handleSubmit: (e: React.FormEvent) => void,
  handleCancel: () => void
) {
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Display Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={handleNameChange}
          className={`mt-1 block w-full px-3 py-2 border ${
            error ? 'border-destructive' : 'border-input'
          } rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring`}
          placeholder="Enter your display name"
          disabled={isLoading}
        />
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
        {_renderFormHelperText()}
      </div>

      <div className="flex space-x-2 justify-end">
        <Button type="button" variant="ghost" onClick={handleCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Name'}
        </Button>
      </div>
    </form>
  );
}

/**
 * Renders helper text for the name input field.
 */
function _renderFormHelperText() {
  return (
    <p className="mt-1 text-sm text-muted-foreground">
      Your name must be between 3 and 30 characters.
    </p>
  );
}
