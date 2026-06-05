'use client';

import { Cloud, Info, Loader2, RefreshCw, Zap } from 'lucide-react';

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

interface ActiveGateway {
  _id: string;
  label: string;
}

interface GatewaySetupCardProps {
  activeGateway: ActiveGateway | null;
  isSettingUp: boolean;
  isSyncing: boolean;
  onSetup: () => void;
  onSync: () => void;
}

export function GatewaySetupCard({
  activeGateway,
  isSettingUp,
  isSyncing,
  onSetup,
  onSync,
}: GatewaySetupCardProps) {
  const isConfigured = activeGateway !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gateway</CardTitle>
        <CardDescription>
          {isConfigured
            ? 'LLM gateway is connected. Sync to load available models.'
            : 'Connect to the Vercel AI Gateway to manage LLM models.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
              <Cloud className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <span className="text-sm font-medium text-foreground">
                {isConfigured ? activeGateway.label : 'Not configured'}
              </span>
              {isConfigured && <p className="text-xs text-muted-foreground">Vercel AI Gateway</p>}
            </div>
          </div>
          <Badge variant={isConfigured ? 'default' : 'secondary'}>
            {isConfigured ? 'Connected' : 'Not configured'}
          </Badge>
        </div>

        {!isConfigured && (
          <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Requires the{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
                AI_GATEWAY_API_KEY
              </code>{' '}
              environment variable to be set in your Convex deployment before setup.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4">
        {isConfigured ? (
          <Button variant="outline" size="sm" disabled={isSyncing} onClick={onSync}>
            {isSyncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sync available models
          </Button>
        ) : (
          <Button variant="default" size="sm" disabled={isSettingUp} onClick={onSetup}>
            {isSettingUp ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Zap className="mr-2 h-4 w-4" />
            )}
            Set up Vercel AI Gateway
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
