'use client';

import { LoginCodeGenerator } from '@/modules/auth/LoginCodeGenerator';
import { NameEditForm } from '@/modules/profile/NameEditForm';

export function UserSettings() {
  return (
    <section aria-labelledby="user-settings-heading" className="space-y-6">
      <div>
        <h2 id="user-settings-heading" className="text-xl font-semibold">
          User details
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage your display name, connected accounts, and access across devices.
        </p>
      </div>
      <div className="space-y-4">
        <NameEditForm />
        <LoginCodeGenerator />
      </div>
    </section>
  );
}
