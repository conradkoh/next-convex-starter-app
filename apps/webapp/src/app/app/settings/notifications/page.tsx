import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotificationsPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold md:text-3xl">Notifications</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Manage where your system notifications are delivered through third-party integrations.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Third-party integrations</CardTitle>
          <CardDescription>
            External providers can deliver system notifications, and the list of available providers
            can grow as more integrations are added.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/app/settings/notifications/third-party">
            <Button variant="outline">Browse integrations</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
