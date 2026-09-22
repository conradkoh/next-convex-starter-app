'use client';

import { ProfileSettings } from '@/modules/settings/profile/ProfileSettings';
import { UserSettings } from '@/modules/settings/user/UserSettings';

export default function UserSettingsPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold md:text-3xl">User settings</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Manage your user information, account access, and recovery options.
        </p>
      </header>
      <UserSettings />
      <ProfileSettings />
    </div>
  );
}
