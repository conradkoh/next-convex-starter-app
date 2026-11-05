'use client';

import { AppearanceSettings } from '@/modules/settings/appearance/AppearanceSettings';

export default function AppearanceSettingsPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold md:text-3xl">Appearance</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Choose how the application looks on your devices.
        </p>
      </header>
      <AppearanceSettings />
    </div>
  );
}
