'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import { useSessionMutation, useSessionQuery } from 'convex-helpers/react/sessions';
import { CheckCircle2, ChevronLeft, CircleHelp, MoreHorizontal, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationsQueryErrorBoundary } from '@/modules/settings/NotificationsQueryErrorBoundary';
import type { NotificationSettingsValue } from '@/modules/settings/NotificationsSettings';
import {
  THIRD_PARTY_PROVIDERS,
  type ThirdPartyProvider,
} from '@/modules/settings/thirdPartyIntegrations';

const GENERIC_REMOVE_ERROR = 'Unable to remove the Telegram connection. Please try again.';
type RemovalStatus = { kind: 'success' | 'error'; message: string } | null;

export default function ThirdPartyIntegrationsPage() {
  return (
    <NotificationsQueryErrorBoundary>
      <ThirdPartyIntegrationsContent />
    </NotificationsQueryErrorBoundary>
  );
}

function ThirdPartyIntegrationsContent() {
  const settings = useSessionQuery(api.notifications.getSettings) as
    NotificationSettingsValue | null | undefined;
  const removeSettings = useSessionMutation(api.notifications.removeSettings);
  const [isRemoving, setIsRemoving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [status, setStatus] = useState<RemovalStatus>(null);
  const [justRemoved, setJustRemoved] = useState(false);
  const availableHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Focus only after the query reflects deletion so the initial empty state keeps its natural focus.
    // eslint-disable-next-line react-you-might-not-need-an-effect/no-event-handler
    if (settings === null && justRemoved) {
      availableHeadingRef.current?.focus();
      // eslint-disable-next-line react-you-might-not-need-an-effect/no-chain-state-updates
      setJustRemoved(false);
    }
  }, [justRemoved, settings]);

  const handleRemove = async () => {
    setIsRemoving(true);
    setStatus(null);
    try {
      await removeSettings({});
      setJustRemoved(true);
      setDeleteDialogOpen(false);
      setStatus({ kind: 'success', message: 'Telegram connection removed.' });
      toast.success('Telegram connection removed.');
    } catch {
      setDeleteDialogOpen(false);
      setStatus({ kind: 'error', message: GENERIC_REMOVE_ERROR });
      toast.error(GENERIC_REMOVE_ERROR);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <ThirdPartyIntegrationsView
      settings={settings}
      status={status}
      availableHeadingRef={availableHeadingRef}
      isRemoving={isRemoving}
      deleteDialogOpen={deleteDialogOpen}
      onDelete={() => setDeleteDialogOpen(true)}
      onDeleteDialogChange={setDeleteDialogOpen}
      onConfirmDelete={handleRemove}
    />
  );
}

type ThirdPartyIntegrationsViewProps = {
  settings: NotificationSettingsValue | null | undefined;
  status: RemovalStatus;
  availableHeadingRef: RefObject<HTMLHeadingElement | null>;
  isRemoving: boolean;
  deleteDialogOpen: boolean;
  onDelete: () => void;
  onDeleteDialogChange: (open: boolean) => void;
  onConfirmDelete: () => void;
};

function ThirdPartyIntegrationsView({
  settings,
  status,
  availableHeadingRef,
  isRemoving,
  deleteDialogOpen,
  onDelete,
  onDeleteDialogChange,
  onConfirmDelete,
}: ThirdPartyIntegrationsViewProps) {
  return (
    <div className="space-y-4 md:space-y-6">
      <Link
        href="/app/settings/notifications"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Notifications
      </Link>

      <header className="space-y-2">
        <h1 className="text-2xl font-bold md:text-3xl">Third-party integrations</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Connect providers that can deliver your system notifications.
        </p>
      </header>

      <IntegrationSections
        settings={settings}
        availableHeadingRef={availableHeadingRef}
        onDelete={onDelete}
      />

      {status && (
        <p
          role="status"
          aria-live="polite"
          className={
            status.kind === 'error'
              ? 'text-sm text-destructive'
              : 'text-sm text-emerald-600 dark:text-emerald-400'
          }
        >
          {status.message}
        </p>
      )}

      <DeleteTelegramDialog
        open={deleteDialogOpen}
        isRemoving={isRemoving}
        onOpenChange={onDeleteDialogChange}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}

function IntegrationSections({
  settings,
  availableHeadingRef,
  onDelete,
}: {
  settings: NotificationSettingsValue | null | undefined;
  availableHeadingRef: RefObject<HTMLHeadingElement | null>;
  onDelete: () => void;
}) {
  if (settings === undefined) {
    return <ThirdPartyIntegrationsLoading />;
  }

  return (
    <>
      {settings ? (
        <ConnectedIntegrationsSection settings={settings} onDelete={onDelete} />
      ) : (
        <AvailableIntegrationsSection availableHeadingRef={availableHeadingRef} />
      )}
      <FutureIntegrationsCard />
    </>
  );
}

function ConnectedIntegrationsSection({
  settings,
  onDelete,
}: {
  settings: NotificationSettingsValue;
  onDelete: () => void;
}) {
  return (
    <section aria-labelledby="connected-integrations-heading" className="space-y-3">
      <div>
        <h2 id="connected-integrations-heading" className="text-lg font-semibold">
          Connected integrations
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage providers currently connected to your account.
        </p>
      </div>
      <ConnectedTelegramCard settings={settings} onDelete={onDelete} />
    </section>
  );
}

function AvailableIntegrationsSection({
  availableHeadingRef,
}: {
  availableHeadingRef: RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <section aria-labelledby="available-integrations-heading" className="space-y-3">
      <div>
        <h2
          id="available-integrations-heading"
          ref={availableHeadingRef}
          tabIndex={-1}
          className="text-lg font-semibold"
        >
          Available integrations
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose a provider to connect to your notification workflow.
        </p>
      </div>
      {THIRD_PARTY_PROVIDERS.map((provider) => (
        <AvailableProviderCard key={provider.id} provider={provider} />
      ))}
    </section>
  );
}

function FutureIntegrationsCard() {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div>
          <p className="font-medium">More integrations coming soon.</p>
          <p className="text-sm text-muted-foreground">
            Additional third-party notification providers can be added here in the future.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ConnectedTelegramCard({
  settings,
  onDelete,
}: {
  settings: NotificationSettingsValue;
  onDelete: () => void;
}) {
  const provider = THIRD_PARTY_PROVIDERS[0];

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="min-w-0 space-y-1">
          <CardTitle>{provider.name}</CardTitle>
          <CardDescription>{provider.description}</CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Actions for Telegram connection"
            className="shrink-0 rounded-md p-2 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem render={<Link href={provider.configureHref} />}>
              Update connection
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              Delete connection
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Channel</span>
          <span className="max-w-full break-all font-medium">{settings.channelId}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={settings.enabled ? 'default' : 'secondary'}>
            {settings.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
          <ConnectionTestStatus settings={settings} />
        </div>
        {settings.lastTestedAt !== undefined && (
          <p className="text-sm text-muted-foreground">
            {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
              settings.lastTestedAt
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ConnectionTestStatus({ settings }: { settings: NotificationSettingsValue }) {
  const testStatus = getConnectionTestStatus(settings);
  const StatusIcon = testStatus.icon;

  return (
    <Badge variant="outline" className={testStatus.className}>
      <StatusIcon />
      {testStatus.label}
    </Badge>
  );
}

function getConnectionTestStatus(settings: NotificationSettingsValue) {
  if (settings.lastTestedAt === undefined) {
    return { label: 'Never tested', icon: CircleHelp, className: 'text-muted-foreground' };
  }

  return settings.lastTestSucceeded
    ? {
        label: 'Last test succeeded',
        icon: CheckCircle2,
        className: 'text-emerald-600 dark:text-emerald-400',
      }
    : { label: 'Last test failed', icon: XCircle, className: 'text-destructive' };
}

function AvailableProviderCard({ provider }: { provider: ThirdPartyProvider }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{provider.name}</CardTitle>
        <CardDescription>{provider.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={provider.configureHref} role="link" />}
        >
          Configure
        </Button>
      </CardContent>
    </Card>
  );
}

function DeleteTelegramDialog({
  open,
  isRemoving,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  isRemoving: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Telegram connection?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the Telegram channel configuration and stops delivery for this connection.
            You can configure it again later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isRemoving}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isRemoving ? 'Deleting...' : 'Delete connection'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ThirdPartyIntegrationsLoading() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading integrations">
      <Skeleton className="h-6 w-56" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
