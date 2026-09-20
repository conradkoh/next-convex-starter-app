'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import { useSessionQuery } from 'convex-helpers/react/sessions';
import Link from 'next/link';
import { Component, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    <main className="container mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your account and system notification preferences.
        </p>
      </header>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList aria-label="Settings sections">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <NotificationsQueryErrorBoundary>
            <NotificationsSettingsContent />
          </NotificationsQueryErrorBoundary>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                Manage your profile information and account preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/app/profile">
                <Button variant="outline">Manage profile</Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
