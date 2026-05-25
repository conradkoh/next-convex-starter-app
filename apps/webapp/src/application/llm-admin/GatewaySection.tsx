'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import type { Id } from '@workspace/backend/convex/_generated/dataModel';
import { useSessionMutation, useSessionQuery } from 'convex-helpers/react/sessions';
import { Plus } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';

interface GatewaySectionProps {
  onActiveGatewayChange?: (gatewayId: Id<'llmGateways'>) => void;
}

export function GatewaySection({ onActiveGatewayChange }: GatewaySectionProps) {
  const gateways = useSessionQuery(api.llmAdmin.getGateways);
  const activateGateway = useSessionMutation(api.llmAdmin.activateGateway);
  const createGateway = useSessionMutation(api.llmAdmin.createOrUpdateGateway);

  const activeGateway = gateways?.find((g) => g.isActive);
  const initialised = useRef(false);

  useEffect(() => {
    if (!initialised.current && activeGateway) {
      initialised.current = true;
      onActiveGatewayChange?.(activeGateway._id as Id<'llmGateways'>);
    }
  }, [activeGateway, onActiveGatewayChange]);

  const handleActivate = useCallback(
    async (gatewayId: Id<'llmGateways'>) => {
      try {
        await activateGateway({ gatewayId });
        onActiveGatewayChange?.(gatewayId);
        toast.success('Active gateway updated');
      } catch {
        toast.error('Failed to update active gateway');
      }
    },
    [activateGateway, onActiveGatewayChange]
  );

  const handleAdd = useCallback(async () => {
    try {
      await createGateway({ kind: 'vercel-ai-gateway', label: 'Vercel AI Gateway' });
      toast.success('Gateway added');
    } catch {
      toast.error('Failed to add gateway');
    }
  }, [createGateway]);

  if (gateways === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-48" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-64" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-40" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Gateway</CardTitle>
        <CardDescription>Select the LLM gateway used across the application</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {gateways.length === 0 ? (
          <p className="text-sm text-muted-foreground">No gateways configured.</p>
        ) : (
          <RadioGroup
            value={activeGateway?._id}
            onValueChange={(v) => handleActivate(v as Id<'llmGateways'>)}
          >
            {gateways.map((gw) => (
              <div key={gw._id} className="flex items-center space-x-2">
                <RadioGroupItem value={gw._id} id={`gw-${gw._id}`} />
                <label
                  htmlFor={`gw-${gw._id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {gw.label}
                  {gw.isActive && (
                    <span className="ml-2 text-xs text-muted-foreground">(active)</span>
                  )}
                </label>
              </div>
            ))}
          </RadioGroup>
        )}
        <Button variant="outline" size="sm" onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Vercel AI Gateway
        </Button>
      </CardContent>
    </Card>
  );
}
