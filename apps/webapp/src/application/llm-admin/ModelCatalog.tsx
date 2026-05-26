'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import type { Id } from '@workspace/backend/convex/_generated/dataModel';
import { useSessionMutation, useSessionQuery } from 'convex-helpers/react/sessions';
import { Loader2, Search, Star } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface GatewayModel {
  id: string;
  name: string;
  providerSlug: string;
  modelSlug: string;
}

interface ModelCatalogProps {
  gatewayId: Id<'llmGateways'>;
  catalog: GatewayModel[] | null;
  isLoading: boolean;
}

export function ModelCatalog({ gatewayId, catalog, isLoading }: ModelCatalogProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Models</CardTitle>
        <CardDescription>Enable models for use and set a default per provider</CardDescription>
      </CardHeader>
      <CardContent>
        <ModelCatalogContent gatewayId={gatewayId} catalog={catalog} isLoading={isLoading} />
      </CardContent>
    </Card>
  );
}

function ModelCatalogContent({ gatewayId, catalog, isLoading }: ModelCatalogProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-full" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-8 w-32" />
            {[...Array(2)].map((_, j) => (
              <Skeleton key={j} className="h-14 w-full" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (catalog === null) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          No models loaded yet. Click &ldquo;Sync available models&rdquo; in the Gateway card above
          to fetch the catalog.
        </p>
      </div>
    );
  }

  if (catalog.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No models returned by the gateway.
      </p>
    );
  }

  return <ModelCatalogList gatewayId={gatewayId} catalog={catalog} />;
}

function ModelCatalogList({
  gatewayId,
  catalog,
}: {
  gatewayId: Id<'llmGateways'>;
  catalog: GatewayModel[];
}) {
  const persistedCatalog = useSessionQuery(api.llmAdmin.getCatalogQuery, { gatewayId });
  const [search, setSearch] = useState('');

  const groups = useMemo(() => {
    const filtered = search
      ? catalog.filter((m) => {
          const q = search.toLowerCase();
          return (
            m.id.toLowerCase().includes(q) ||
            m.name.toLowerCase().includes(q) ||
            m.providerSlug.toLowerCase().includes(q)
          );
        })
      : catalog;

    const groupMap = new Map<string, GatewayModel[]>();
    for (const model of filtered) {
      const existing = groupMap.get(model.providerSlug);
      if (existing) {
        existing.push(model);
      } else {
        groupMap.set(model.providerSlug, [model]);
      }
    }

    return [...groupMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([slug, models]) => ({ providerSlug: slug, models }));
  }, [catalog, search]);

  const enabledCount = useMemo(
    () =>
      persistedCatalog?.reduce((acc, p) => acc + p.models.filter((m) => m.isEnabled).length, 0) ??
      0,
    [persistedCatalog]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Label className="sr-only" htmlFor="model-search">
            Search models
          </Label>
          <Input
            id="model-search"
            placeholder="Search models..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Badge variant="secondary" className="shrink-0">
          {enabledCount}/{catalog.length}
        </Badge>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No models match &ldquo;{search}&rdquo;.</p>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <ProviderSection
              key={group.providerSlug}
              providerSlug={group.providerSlug}
              gatewayModels={group.models}
              gatewayId={gatewayId}
              persistedCatalog={persistedCatalog}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ProviderSectionProps {
  providerSlug: string;
  gatewayModels: GatewayModel[];
  gatewayId: Id<'llmGateways'>;
  persistedCatalog:
    | {
        providerId: string;
        providerSlug: string;
        providerLabel: string;
        isEnabled: boolean;
        models: {
          modelId: string;
          modelSlug: string;
          modelLabel: string;
          isEnabled: boolean;
          isDefault: boolean;
        }[];
      }[]
    | undefined;
}

function ProviderSection({
  providerSlug,
  gatewayModels,
  gatewayId,
  persistedCatalog,
}: ProviderSectionProps) {
  const persistedProvider = useMemo(
    () => persistedCatalog?.find((p) => p.providerSlug === providerSlug),
    [persistedCatalog, providerSlug]
  );

  const enabledCount = useMemo(
    () => persistedProvider?.models.filter((m) => m.isEnabled).length ?? 0,
    [persistedProvider]
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
        <span className="text-sm font-medium text-foreground capitalize">{providerSlug}</span>
        <Badge variant="secondary" className="text-xs">
          {enabledCount}/{gatewayModels.length}
        </Badge>
      </div>

      <div className="space-y-1">
        {gatewayModels.map((model) => {
          const persisted = persistedProvider?.models.find((m) => m.modelSlug === model.modelSlug);
          return (
            <ModelRow
              key={model.id}
              model={model}
              providerSlug={providerSlug}
              gatewayId={gatewayId}
              persisted={persisted}
              providerId={persistedProvider?.providerId}
            />
          );
        })}
      </div>
    </div>
  );
}

interface ModelRowProps {
  model: GatewayModel;
  providerSlug: string;
  gatewayId: Id<'llmGateways'>;
  persisted:
    | {
        modelId: string;
        modelSlug: string;
        modelLabel: string;
        isEnabled: boolean;
        isDefault: boolean;
      }
    | undefined;
  providerId: string | undefined;
}

function ModelRow({ model, providerSlug, gatewayId, persisted, providerId }: ModelRowProps) {
  const enableModel = useSessionMutation(api.llmAdmin.setCatalogModelEnabled);
  const makeDefault = useSessionMutation(api.llmAdmin.makeDefaultModel);

  const [pending, setPending] = useState<'toggle' | 'default' | null>(null);

  const isEnabled = persisted?.isEnabled ?? false;
  const isDefault = persisted?.isDefault ?? false;
  const isPersisted = !!persisted;

  const handleToggle = useCallback(async () => {
    setPending('toggle');
    try {
      await enableModel({
        gatewayId,
        providerSlug,
        providerLabel: providerSlug,
        modelSlug: model.modelSlug,
        modelLabel: model.name,
      });
      toast.success(`${model.name} ${!isEnabled ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error(`Failed to toggle ${model.name}`);
    } finally {
      setPending(null);
    }
  }, [enableModel, gatewayId, providerSlug, model, isEnabled]);

  const handleSetDefault = useCallback(async () => {
    if (!persisted || !isEnabled) return;
    setPending('default');
    try {
      await makeDefault({
        modelId: persisted.modelId as Id<'llmModels'>,
        providerId: providerId as Id<'llmProviders'>,
      });
      toast.success(`Set ${model.name} as default`);
    } catch {
      toast.error('Failed to set default model');
    } finally {
      setPending(null);
    }
  }, [makeDefault, persisted, isEnabled, model.name, providerId]);

  return (
    <div
      className={`flex items-center justify-between rounded-md border px-3 py-2 transition-opacity ${
        !isEnabled ? 'opacity-60' : ''
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{model.name}</p>
        <p className="truncate font-mono text-xs text-muted-foreground">{model.id}</p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {pending === 'toggle' ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggle}
            aria-label={`${isEnabled ? 'Disable' : 'Enable'} ${model.name}`}
          />
        )}

        {pending === 'default' ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : isDefault ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Star
                className="h-4 w-4 fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400"
                aria-hidden="true"
              />
            </TooltipTrigger>
            <TooltipContent>Default model for {providerSlug}</TooltipContent>
          </Tooltip>
        ) : isEnabled && isPersisted ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleSetDefault}
                aria-label={`Set ${model.name} as default`}
              >
                <Star className="h-4 w-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Set as default for {providerSlug}</TooltipContent>
          </Tooltip>
        ) : (
          <Star className="h-4 w-4 text-muted-foreground/30" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
