'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import type { Id } from '@workspace/backend/convex/_generated/dataModel';
import { useSessionMutation, useSessionQuery } from 'convex-helpers/react/sessions';
import { Cloud, Loader2, RefreshCw } from 'lucide-react';
import { useCallback } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface GatewayStatusCardProps {
  onGatewayReady: (gatewayId: Id<'llmGateways'>) => void;
  onSyncRequested: () => void;
  isSyncing: boolean;
}

export function GatewayStatusCard({
  onGatewayReady,
  onSyncRequested,
  isSyncing,
}: GatewayStatusCardProps) {
  const gateways = useSessionQuery(api.llmAdmin.getGateways);
  const activateGateway = useSessionMutation(api.llmAdmin.activateGateway);
  const createGateway = useSessionMutation(api.llmAdmin.createOrUpdateGateway);

  const activeGateway = gateways?.find((g) => g.isActive);

  const handleSetup = useCallback(async () => {
    try {
      const gatewayId = await createGateway({
        kind: 'vercel-ai-gateway',
        label: 'Vercel AI Gateway',
      });
      await activateGateway({ gatewayId: gatewayId as Id<'llmGateways'> });
      onGatewayReady(gatewayId as Id<'llmGateways'>);
      onSyncRequested();
      toast.success('Vercel AI Gateway connected');
    } catch {
      toast.error('Failed to set up gateway');
    }
  }, [createGateway, activateGateway, onGatewayReady, onSyncRequested]);

  if (gateways === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-24" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-48" />
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-5 w-40" />
        </CardContent>
        <CardFooter className="border-t">
          <Skeleton className="h-9 w-48" />
        </CardFooter>
      </Card>
    );
  }

  const isConfigured = !!activeGateway;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gateway</CardTitle>
        <CardDescription>
          {isConfigured
            ? 'LLM gateway is configured and connected'
            : 'No LLM gateway has been configured'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
            <Cloud className="h-5 w-5 text-muted-foreground" />
          </div>
          <span className="text-sm font-medium text-foreground">
            {isConfigured ? activeGateway.label : 'Not configured yet'}
          </span>
        </div>
        <Badge variant={isConfigured ? 'default' : 'secondary'}>
          {isConfigured ? 'Connected' : 'Not configured'}
        </Badge>
      </CardContent>
      <CardFooter className="border-t">
        {isConfigured ? (
          <Button variant="outline" size="sm" disabled={isSyncing} onClick={onSyncRequested}>
            {isSyncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sync available models
          </Button>
        ) : (
          <Button variant="default" size="sm" onClick={handleSetup}>
            Set up Vercel AI Gateway
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
