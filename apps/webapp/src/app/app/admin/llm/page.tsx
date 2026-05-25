'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import type { Id } from '@workspace/backend/convex/_generated/dataModel';
import { useSessionAction, useSessionQuery } from 'convex-helpers/react/sessions';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ConfigSummaryCard } from '@/application/llm-admin/ConfigSummaryCard';
import { GatewayStatusCard } from '@/application/llm-admin/GatewayStatusCard';
import { ModelCatalog } from '@/application/llm-admin/ModelCatalog';

interface GatewayModel {
  id: string;
  name: string;
  providerSlug: string;
  modelSlug: string;
}

export default function LLMConfigPage() {
  const gateways = useSessionQuery(api.llmAdmin.getGateways);
  const fetchModels = useSessionAction(api.llmAdmin.getAvailableModelsFromGateway);

  const [activeGatewayId, setActiveGatewayId] = useState<Id<'llmGateways'> | null>(null);
  const [catalog, setCatalog] = useState<GatewayModel[] | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current && gateways) {
      initialized.current = true;
      const active = gateways.find((g) => g.isActive);
      if (active) {
        setActiveGatewayId(active._id as unknown as Id<'llmGateways'>);
      }
    }
  }, [gateways]);

  const handleSync = useCallback(async () => {
    if (!activeGatewayId) return;
    setIsSyncing(true);
    try {
      const models = await fetchModels({ gatewayId: activeGatewayId });
      setCatalog(models);
      toast.success(`Loaded ${models.length} models`);
    } catch {
      toast.error('Failed to load models from gateway');
    } finally {
      setIsSyncing(false);
    }
  }, [fetchModels, activeGatewayId]);

  return (
    <div className="space-y-6 pt-6 max-w-4xl">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">LLM Configuration</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Configure the gateway, enable models, and set defaults for the application.
        </p>
      </div>

      <GatewayStatusCard
        onGatewayReady={setActiveGatewayId}
        onSyncRequested={handleSync}
        isSyncing={isSyncing}
      />

      <ModelCatalog gatewayId={activeGatewayId} catalog={catalog} isLoading={isSyncing} />

      <ConfigSummaryCard gatewayId={activeGatewayId} />
    </div>
  );
}
