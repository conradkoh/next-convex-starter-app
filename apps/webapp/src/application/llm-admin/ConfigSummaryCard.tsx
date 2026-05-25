'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import type { Id } from '@workspace/backend/convex/_generated/dataModel';
import { useSessionQuery } from 'convex-helpers/react/sessions';
import { TriangleAlert } from 'lucide-react';
import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ConfigSummaryCardProps {
  gatewayId: Id<'llmGateways'> | null;
}

function ConfigSummaryInner({ gatewayId }: { gatewayId: Id<'llmGateways'> }) {
  const providers = useSessionQuery(api.llmAdmin.getProviders, { gatewayId });

  if (providers === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Configuration</CardTitle>
          <CardDescription>
            What the application will use when a product feature calls the LLM
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="ml-4 h-4 w-48" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const enabledProviders = providers.filter((p) => p.isEnabled);

  if (enabledProviders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Configuration</CardTitle>
          <CardDescription>
            What the application will use when a product feature calls the LLM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No models enabled yet. Enable models in the catalog above.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Configuration</CardTitle>
        <CardDescription>
          What the application will use when a product feature calls the LLM
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {enabledProviders.map((provider) => (
          <ProviderSummaryRow
            key={provider._id}
            providerId={provider._id as unknown as Id<'llmProviders'>}
            providerSlug={provider.slug}
          />
        ))}
      </CardContent>
    </Card>
  );
}

interface ProviderSummaryRowProps {
  providerId: Id<'llmProviders'>;
  providerSlug: string;
}

function ProviderSummaryRow({ providerId, providerSlug }: ProviderSummaryRowProps) {
  const models = useSessionQuery(api.llmAdmin.getModels, { providerId });

  const enabledModels = useMemo(() => (models ?? []).filter((m) => m.isEnabled), [models]);

  const hasDefault = useMemo(
    () => (models ?? []).some((m) => m.isDefault && m.isEnabled),
    [models]
  );

  if (models === undefined) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="ml-4 h-4 w-40" />
      </div>
    );
  }

  if (enabledModels.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="font-mono text-sm font-medium text-foreground">{providerSlug}</p>
      <div className="ml-4 space-y-1">
        {enabledModels.map((model) => (
          <div key={model._id} className="flex items-center gap-2">
            <p className="font-mono text-sm text-muted-foreground">{model.slug}</p>
            {model.isDefault && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0">
                Default
              </Badge>
            )}
          </div>
        ))}
      </div>
      {!hasDefault && (
        <div className="ml-4 flex items-center gap-1.5">
          <TriangleAlert
            className="h-4 w-4 text-amber-600 dark:text-amber-400"
            aria-hidden="true"
          />
          <span className="text-xs text-amber-600 dark:text-amber-400">No default model set</span>
        </div>
      )}
    </div>
  );
}

export function ConfigSummaryCard({ gatewayId }: ConfigSummaryCardProps) {
  if (gatewayId === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Configuration</CardTitle>
          <CardDescription>
            What the application will use when a product feature calls the LLM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No gateway configured.</p>
        </CardContent>
      </Card>
    );
  }

  return <ConfigSummaryInner gatewayId={gatewayId} />;
}
