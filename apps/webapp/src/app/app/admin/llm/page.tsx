'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import type { Id } from '@workspace/backend/convex/_generated/dataModel';
import {
  useSessionAction,
  useSessionMutation,
  useSessionQuery,
} from 'convex-helpers/react/sessions';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ConfigSummaryCard } from '@/application/llm-admin/ConfigSummaryCard';
import { GatewaySetupCard } from '@/application/llm-admin/GatewaySetupCard';
import { ModelCatalog } from '@/application/llm-admin/ModelCatalog';
import { Skeleton } from '@/components/ui/skeleton';

interface GatewayModel {
  id: string;
  name: string;
  providerSlug: string;
  modelSlug: string;
}

export default function LLMConfigPage() {
  const gateways = useSessionQuery(api.llmAdmin.getGateways);
  const createGateway = useSessionMutation(api.llmAdmin.createOrUpdateGateway);
  const activateGateway = useSessionMutation(api.llmAdmin.activateGateway);
  const fetchModels = useSessionAction(api.llmAdmin.getAvailableModelsFromGateway);

  const [catalog, setCatalog] = useState<GatewayModel[] | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);

  const syncedOnce = useRef(false);

  const activeGateway = useMemo(() => gateways?.find((g) => g.isActive) ?? null, [gateways]);

  const activeGatewayId = useMemo(
    () => (activeGateway ? (activeGateway._id as unknown as Id<'llmGateways'>) : null),
    [activeGateway]
  );

  useEffect(() => {
    if (activeGatewayId && !syncedOnce.current) {
      syncedOnce.current = true;
    }
  }, [activeGatewayId]);

  const syncModels = useCallback(
    async (gatewayId: Id<'llmGateways'>) => {
      setIsSyncing(true);
      try {
        const models = await fetchModels({ gatewayId });
        setCatalog(models);
        if (models.length === 0) {
          toast.warning('No models returned by the gateway');
        } else {
          toast.success(`Loaded ${models.length} models`);
        }
      } catch {
        toast.error('Failed to load models from gateway. Is AI_GATEWAY_API_KEY set?');
      } finally {
        setIsSyncing(false);
      }
    },
    [fetchModels]
  );

  const handleSetup = useCallback(async () => {
    setIsSettingUp(true);
    try {
      const gatewayId = await createGateway({
        kind: 'vercel-ai-gateway',
        label: 'Vercel AI Gateway',
      });
      await activateGateway({ gatewayId: gatewayId as Id<'llmGateways'> });
      toast.success('Vercel AI Gateway connected');
      syncModels(gatewayId as Id<'llmGateways'>);
    } catch {
      toast.error('Failed to set up gateway');
    } finally {
      setIsSettingUp(false);
    }
  }, [createGateway, activateGateway, syncModels]);

  const handleSync = useCallback(async () => {
    if (!activeGatewayId) return;
    syncModels(activeGatewayId);
  }, [activeGatewayId, syncModels]);

  if (gateways === undefined) {
    return (
      <div className="space-y-6 pt-6 max-w-4xl">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold">LLM Configuration</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Configure the gateway, enable models, and set defaults for the application.
          </p>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const isConfigured = activeGateway !== null;

  return (
    <div className="space-y-6 pt-6 max-w-4xl">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">LLM Configuration</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Configure the gateway, enable models, and set defaults for the application.
        </p>
      </div>

      <GatewaySetupCard
        activeGateway={activeGateway}
        isSettingUp={isSettingUp}
        isSyncing={isSyncing}
        onSetup={handleSetup}
        onSync={handleSync}
      />

      {isConfigured && (
        <ModelCatalog gatewayId={activeGatewayId!} catalog={catalog} isLoading={isSyncing} />
      )}

      <ConfigSummaryCard gatewayId={activeGatewayId} />
    </div>
  );
}
