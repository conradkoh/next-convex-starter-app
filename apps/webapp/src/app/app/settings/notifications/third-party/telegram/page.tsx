'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import { useSessionQuery } from 'convex-helpers/react/sessions';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { NotificationsQueryErrorBoundary } from '@/modules/settings/NotificationsQueryErrorBoundary';
import {
  NotificationsSettings,
  type NotificationSettingsValue,
} from '@/modules/settings/NotificationsSettings';

const THIRD_PARTY_ROUTE = '/app/settings/notifications/third-party';

export default function TelegramSettingsPage() {
  return (
    <NotificationsQueryErrorBoundary>
      <TelegramSettingsContent />
    </NotificationsQueryErrorBoundary>
  );
}

function TelegramSettingsContent() {
  const router = useRouter();
  const settings = useSessionQuery(api.notifications.getSettings) as
    NotificationSettingsValue | null | undefined;
  const isUpdate = settings !== null && settings !== undefined;

  return (
    <div className="space-y-4 md:space-y-6">
      <Link
        href={THIRD_PARTY_ROUTE}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Third-party integrations
      </Link>

      <header className="space-y-2">
        <h1 className="text-2xl font-bold md:text-3xl">
          {isUpdate ? 'Update Telegram' : 'Configure Telegram'}
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Add your Telegram bot to the target channel or group and give it permission to post
          messages before testing the connection.
        </p>
      </header>

      <NotificationsSettings settings={settings} onSaved={() => router.push(THIRD_PARTY_ROUTE)} />
    </div>
  );
}
