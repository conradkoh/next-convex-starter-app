'use client';

import type { Id } from '@workspace/backend/convex/_generated/dataModel';
import { useCallback, useState } from 'react';

import { GatewaySection } from '@/application/llm-admin/GatewaySection';
import { ModelSection } from '@/application/llm-admin/ModelSection';
import { ProviderSection } from '@/application/llm-admin/ProviderSection';
import { Separator } from '@/components/ui/separator';

export default function LLMConfigPage() {
  const [activeGatewayId, setActiveGatewayId] = useState<Id<'llmGateways'> | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  const handleActiveGatewayChange = useCallback((gatewayId: Id<'llmGateways'>) => {
    setActiveGatewayId(gatewayId);
    setSelectedProviderId(null);
  }, []);

  const handleProviderSelect = useCallback((providerId: string | null) => {
    setSelectedProviderId(providerId);
  }, []);

  return (
    <div className="space-y-6 pt-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">LLM Provider Configuration</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Configure LLM gateways, providers, and models for the application
        </p>
      </div>

      <GatewaySection onActiveGatewayChange={handleActiveGatewayChange} />

      <Separator />

      <ProviderSection
        gatewayId={activeGatewayId}
        selectedProviderId={selectedProviderId}
        onProviderSelect={handleProviderSelect}
      />

      <Separator />

      <ModelSection providerId={selectedProviderId} />
    </div>
  );
}
