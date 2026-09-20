'use client';

import Link from 'next/link';
import { Suspense, useMemo } from 'react';

import { SearchParamsErrorHandler } from '@/components/SearchParamsErrorHandler';
import { Button } from '@/components/ui/button';
import { useAuthState } from '@/modules/auth/AuthProvider';
import { AppearanceSettings } from '@/modules/settings/appearance/AppearanceSettings';
import { ProfileSettings } from '@/modules/settings/profile/ProfileSettings';
import { UserSettings } from '@/modules/settings/user/UserSettings';

/**
 * Displays the user profile page with account management, theme settings, and recovery options.
 * This route remains as a compatibility surface while settings routes are migrated.
 */
function ProfilePageContent() {
  const authState = useAuthState();

  const isAuthenticated = useMemo(() => {
    return authState?.state === 'authenticated' && !!authState?.user;
  }, [authState]);

  if (!isAuthenticated) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4">
        <h1 className="mb-2 text-xl font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">
          You need to be logged in to view your profile.
        </p>
        <Link href="/login" className="mt-4">
          <Button>Log In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl space-y-6 p-4">
      <div>
        <h1 className="mb-2 text-2xl font-bold">Profile</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Manage your account information and preferences.
        </p>

        <div className="space-y-6">
          <UserSettings />
          <AppearanceSettings />
          <ProfileSettings />
        </div>
      </div>
    </div>
  );
}

/**
 * Loading state for the profile page
 */
function ProfilePageLoading() {
  return (
    <div className="container mx-auto max-w-2xl p-4">
      <div className="animate-pulse space-y-6">
        <div>
          <div className="mb-2 h-8 w-32 rounded bg-muted" />
          <div className="mb-6 h-4 w-64 rounded bg-muted" />
        </div>
        <div className="border-t pt-6">
          <div className="mb-4 h-6 w-48 rounded bg-muted" />
          <div className="space-y-4">
            <div className="h-16 rounded bg-muted" />
            <div className="h-16 rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main profile page component with Suspense boundary
 */
export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfilePageLoading />}>
      <SearchParamsErrorHandler />
      <ProfilePageContent />
    </Suspense>
  );
}
