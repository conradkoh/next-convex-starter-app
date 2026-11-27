'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

/** Minimal header shown when <Navigation/> fails. Same h-16 slot; no router; never imports Navigation/APP_SHORT_NAME. */
export function NavigationFallback() {
  const [isReloading, setIsReloading] = useState(false);
  return (
    <header className="z-50 w-full shrink-0 border-b bg-background">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <a href="/" className="mr-auto text-sm font-medium underline-offset-4 hover:underline">
          Home
        </a>
        <p className="hidden text-xs text-muted-foreground sm:block">
          The menu couldn&apos;t load.
        </p>
        <Button
          variant="outline"
          size="sm"
          disabled={isReloading}
          onClick={() => {
            setIsReloading(true);
            window.location.reload();
          }}
        >
          {isReloading ? 'Reloading…' : 'Reload'}
        </Button>
      </div>
    </header>
  );
}
