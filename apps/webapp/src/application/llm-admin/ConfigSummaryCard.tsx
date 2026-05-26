'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import type { Id } from '@workspace/backend/convex/_generated/dataModel';
import { useSessionQuery } from 'convex-helpers/react/sessions';
import { TriangleAlert } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ConfigSummaryCardProps {
  gatewayId: Id<'llmGateways'> | null;
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

function ConfigSummaryInner({ gatewayId }: { gatewayId: Id<'llmGateways'> }) {
  const catalog = useSessionQuery(api.llmAdmin.getCatalogQuery, { gatewayId });

  if (catalog === undefined) {
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

  const enabledProviders = catalog.filter((p) => p.isEnabled);
  const allEnabledModels = enabledProviders.flatMap((p) => p.models.filter((m) => m.isEnabled));

  if (allEnabledModels.length === 0) {
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

  const providerLabels = new Map<string, string>();
  for (const p of catalog) {
    providerLabels.set(p.providerSlug, p.providerLabel);
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
        {enabledProviders.map((provider) => {
          const enabledModels = provider.models.filter((m) => m.isEnabled);
          if (enabledModels.length === 0) return null;

          const hasDefault = enabledModels.some((m) => m.isDefault);

          return (
            <div key={provider.providerId} className="space-y-2">
              <p className="font-medium text-sm text-foreground">{provider.providerLabel}</p>
              <div className="ml-4 space-y-1">
                {enabledModels.map((model) => (
                  <div key={model.modelId} className="flex items-center gap-2">
                    <p className="font-mono text-sm text-muted-foreground">{model.modelLabel}</p>
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
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    No default model set
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
