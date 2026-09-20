'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import { useSessionQuery } from 'convex-helpers/react/sessions';
import { Component, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  NotificationsSettings,
  type NotificationSettingsValue,
} from '@/modules/settings/NotificationsSettings';

function NotificationsSettingsLoading() {
  return (
    <Card aria-busy="true" aria-label="Loading notification settings">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
        <Skeleton className="h-9 w-32" />
      </CardContent>
    </Card>
  );
}

class NotificationsQueryErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card role="alert">
          <CardHeader>
            <CardTitle>Unable to load notification settings</CardTitle>
            <CardDescription>
              We could not load your Telegram notification settings. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" onClick={() => this.setState({ hasError: false })}>
              Try again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

function NotificationsSettingsContent() {
  const settings = useSessionQuery(api.notifications.getSettings) as
    NotificationSettingsValue | null | undefined;

  return settings === undefined ? (
    <NotificationsSettingsLoading />
  ) : (
    <NotificationsSettings settings={settings} />
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold md:text-3xl">Notifications</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Configure where your system notifications are delivered.
        </p>
      </header>
      <NotificationsQueryErrorBoundary>
        <NotificationsSettingsContent />
      </NotificationsQueryErrorBoundary>
    </div>
  );
}
