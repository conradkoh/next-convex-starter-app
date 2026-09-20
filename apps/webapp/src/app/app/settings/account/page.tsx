'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AccountSettingsPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold md:text-3xl">Account</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Manage your profile information and account preferences.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your name, theme, and account recovery options.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/app/profile">
            <Button variant="outline">Manage profile</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
