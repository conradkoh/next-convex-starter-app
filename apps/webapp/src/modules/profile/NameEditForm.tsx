'use client';

import { Button } from '@/components/ui/button';
import { useAuthState } from '@/lib/auth/AuthProvider';
import { api } from '@workspace/backend/convex/_generated/api';
import { useSessionMutation } from 'convex-helpers/react/sessions';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

/**
 * Name edit form component allowing users to update their display name.
 * Supports different user types (Google, anonymous, full account) with appropriate messaging.
 */
export function NameEditForm() {
  const authState = useAuthState();
  const updateUserName = useSessionMutation(api.auth.updateUserName);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(authState?.state === 'authenticated' ? authState.user.name : '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (authState?.state !== 'authenticated') {
    return null;
  }

  return (
    <div className="space-y-4">
      {_renderHeader(isEditing, startEditing)}
      {isEditing
        ? _renderEditForm(name, error, isLoading, handleNameChange, handleSubmit, handleCancel)
        : _renderDisplayView(authState.user)}
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
  >
) {
  return (
    <div className="p-4 bg-secondary/50 rounded-md">
      <div className="flex items-center space-x-3">
        {_renderUserAvatar(user)}
        <div className="flex-1">
          <p className="font-medium">{user.name}</p>
          {_renderUserTypeInfo(user)}
        </div>
      </div>
    </div>
  );
}

/**
 * Renders the user avatar if available (for Google accounts).
 */
function _renderUserAvatar(user: { type: string; picture?: string; name: string }) {
  if (user.type === 'google' && user.picture) {
    return (
      <img src={user.picture} alt={`${user.name}'s profile`} className="w-12 h-12 rounded-full" />
    );
  }
  return null;
}

/**
 * Renders user type-specific information.
 */
function _renderUserTypeInfo(user: { type: string; email?: string }) {
  if (user.type === 'google') {
    return (
      <div className="mt-1 text-sm text-muted-foreground">
        <p>Google Account: {user.email}</p>
        <div className="flex items-center mt-1">
          {_renderGoogleIcon()}
          <span>Signed in with Google</span>
        </div>
      </div>
    );
  }

  if (user.type === 'anonymous') {
    return (
      <p className="mt-2 text-sm text-muted-foreground">
        You can personalize your anonymous account by changing your display name.
      </p>
    );
  }

  if (user.type === 'full') {
    return <p className="mt-1 text-sm text-muted-foreground">Email: {user.email}</p>;
  }

  return null;
}

/**
 * Renders the Google brand icon.
 */
function _renderGoogleIcon() {
  return (
    <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
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
 * Renders helper text based on user type.
 */
function _renderFormHelperText() {
  // This could be enhanced to show different text based on user type
  // For now, keeping it simple
  return (
    <p className="mt-1 text-sm text-muted-foreground">
      Your name must be between 3 and 30 characters.
    </p>
  );
}
