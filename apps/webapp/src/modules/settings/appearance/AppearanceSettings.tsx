'use client';

import { ThemeSettings } from '@/modules/theme/ThemeSettings';

export function AppearanceSettings() {
  return (
    <section aria-labelledby="appearance-settings-heading" className="space-y-6">
      <div>
        <h2 id="appearance-settings-heading" className="text-xl font-semibold">
          Appearance
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose how the application looks on your devices.
        </p>
      </div>
      <ThemeSettings />
    </section>
  );
}
