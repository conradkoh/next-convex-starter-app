'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import { useSessionAction, useSessionMutation } from 'convex-helpers/react/sessions';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';

export type NotificationSettingsValue = {
  provider: 'telegram';
  enabled: boolean;
  channelId: string;
  hasBotToken: boolean;
  lastTestedAt?: number;
  lastTestSucceeded?: boolean;
};

export type NotificationsSettingsProps = {
  settings: NotificationSettingsValue | null | undefined;
  onSaved?: () => void;
};

type SettingsSnapshot = Pick<NotificationSettingsValue, 'channelId' | 'enabled' | 'hasBotToken'>;
type Status = { kind: 'success' | 'error' | 'info'; message: string } | null;

const GENERIC_SAVE_ERROR = 'Unable to save notification settings. Please try again.';
const GENERIC_TEST_ERROR = 'Unable to test the Telegram connection. Please try again.';

// fallow-ignore-next-line complexity
export function NotificationsSettings({ settings, onSaved }: NotificationsSettingsProps) {
  const [channelId, setChannelId] = useState(settings?.channelId ?? '');
  const [botToken, setBotToken] = useState('');
  const [enabled, setEnabled] = useState(settings?.enabled ?? true);
  const [savedSnapshot, setSavedSnapshot] = useState<SettingsSnapshot | null>(
    settings
      ? {
          channelId: settings.channelId,
          enabled: settings.enabled,
          hasBotToken: settings.hasBotToken,
        }
      : null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const saveSettings = useSessionMutation(api.notifications.saveSettings);
  const testConnection = useSessionAction(api.notifications.telegram.testConnection);

  const isBusy = isSaving || isTesting;
  const isDirty = savedSnapshot
    ? channelId.trim() !== savedSnapshot.channelId ||
      enabled !== savedSnapshot.enabled ||
      botToken.trim() !== ''
    : channelId.trim() !== '' || botToken.trim() !== '' || enabled !== true;
  const testHint = !savedSnapshot
    ? 'Save a configuration before testing.'
    : isDirty
      ? 'Save your changes before testing.'
      : null;

  // fallow-ignore-next-line complexity
  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedChannelId = channelId.trim();
    const normalizedBotToken = botToken.trim();

    if (!normalizedChannelId) {
      setValidationError('Enter a Telegram channel ID or @channel username.');
      return;
    }
    if (!savedSnapshot?.hasBotToken && !normalizedBotToken) {
      setValidationError('Enter a Telegram bot token for the first save.');
      return;
    }

    setValidationError(null);
    setStatus(null);
    setIsSaving(true);
    try {
      const saved = await saveSettings({
        channelId: normalizedChannelId,
        botToken: normalizedBotToken,
        enabled,
      });
      setChannelId(saved.channelId);
      setBotToken('');
      setEnabled(saved.enabled);
      setSavedSnapshot({
        channelId: saved.channelId,
        enabled: saved.enabled,
        hasBotToken: saved.hasBotToken,
      });
      setStatus({ kind: 'success', message: 'Telegram notification settings saved.' });
      toast.success('Telegram notification settings saved.');
      onSaved?.();
    } catch {
      setStatus({ kind: 'error', message: GENERIC_SAVE_ERROR });
      toast.error(GENERIC_SAVE_ERROR);
    } finally {
      setIsSaving(false);
    }
  };

  // fallow-ignore-next-line complexity
  const handleTest = async () => {
    if (!savedSnapshot || isDirty) return;

    setStatus(null);
    setIsTesting(true);
    try {
      const result = await testConnection({});
      if (result.success) {
        setStatus({ kind: 'success', message: result.message });
        toast.success(result.message);
      } else {
        setStatus({ kind: 'error', message: result.message });
        toast.error(result.message);
      }
    } catch {
      setStatus({ kind: 'error', message: GENERIC_TEST_ERROR });
      toast.error(GENERIC_TEST_ERROR);
    } finally {
      setIsTesting(false);
    }
  };

  if (settings === undefined) {
    return <NotificationsSettingsLoading />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Telegram notifications</CardTitle>
        <CardDescription>
          Send system notifications to your Telegram channel or group. Add the bot to the target
          channel and give it permission to post messages.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSave}>
          <div className="space-y-2">
            <Label htmlFor="telegram-channel-id">Channel ID or username</Label>
            <Input
              id="telegram-channel-id"
              name="channelId"
              value={channelId}
              onChange={(event) => {
                setChannelId(event.target.value);
                setValidationError(null);
              }}
              placeholder="-1001234567890 or @my_channel"
              aria-describedby="telegram-channel-id-help"
              aria-invalid={validationError !== null && channelId.trim() === ''}
              required
              disabled={isBusy}
            />
            <p id="telegram-channel-id-help" className="text-sm text-muted-foreground">
              Use the numeric Telegram ID or an @channel username. Keep the value as provided by
              Telegram.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telegram-bot-token">Bot token</Label>
            <Input
              id="telegram-bot-token"
              name="botToken"
              type="password"
              autoComplete="new-password"
              value={botToken}
              onChange={(event) => {
                setBotToken(event.target.value);
                setValidationError(null);
              }}
              placeholder={
                savedSnapshot?.hasBotToken
                  ? 'Leave blank to keep the saved bot token'
                  : 'Enter your Telegram bot token'
              }
              aria-describedby="telegram-bot-token-help"
              aria-invalid={
                validationError !== null && !savedSnapshot?.hasBotToken && botToken.trim() === ''
              }
              disabled={isBusy}
            />
            <p id="telegram-bot-token-help" className="text-sm text-muted-foreground">
              Tokens are stored on the server and are never shown after saving.
            </p>
          </div>

          <div className="flex items-start justify-between gap-4 rounded-md border p-4">
            <div className="space-y-1">
              <Label htmlFor="telegram-enabled">Enabled</Label>
              <p id="telegram-enabled-help" className="text-sm text-muted-foreground">
                Allow system notifications to be delivered to this Telegram configuration.
              </p>
            </div>
            <Switch
              id="telegram-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
              aria-describedby="telegram-enabled-help"
              aria-label="Enable Telegram notifications"
              disabled={isBusy}
            />
          </div>

          {validationError && (
            <p className="text-sm text-destructive" role="alert">
              {validationError}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={isBusy}>
              {isSaving ? 'Saving...' : 'Save settings'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={isBusy || !savedSnapshot || isDirty}
            >
              {isTesting ? 'Testing...' : 'Test connection'}
            </Button>
          </div>

          {testHint && <p className="text-sm text-muted-foreground">{testHint}</p>}

          {settings?.lastTestedAt !== undefined && (
            <p className="text-sm text-muted-foreground">
              Last connection test {settings.lastTestSucceeded ? 'succeeded' : 'failed'} on{' '}
              {new Intl.DateTimeFormat(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              }).format(settings.lastTestedAt)}
              .
            </p>
          )}

          <p
            role="status"
            aria-live="polite"
            className={
              status?.kind === 'error'
                ? 'text-sm text-destructive'
                : status?.kind === 'success'
                  ? 'text-sm text-primary'
                  : 'text-sm text-muted-foreground'
            }
          >
            {status?.message}
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

function NotificationsSettingsLoading() {
  return (
    <Card aria-busy="true" aria-label="Loading notification settings">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </CardHeader>
      <CardContent className="space-y-6">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-32" />
      </CardContent>
    </Card>
  );
}
