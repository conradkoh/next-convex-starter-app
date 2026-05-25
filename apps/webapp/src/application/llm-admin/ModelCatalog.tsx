'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import type { Id } from '@workspace/backend/convex/_generated/dataModel';
import { useSessionMutation, useSessionQuery } from 'convex-helpers/react/sessions';
import { Loader2, Search } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';

interface GatewayModel {
  id: string;
  name: string;
  providerSlug: string;
  modelSlug: string;
}

interface ModelCatalogInnerProps {
  gatewayId: Id<'llmGateways'>;
  catalog: GatewayModel[] | null;
  isLoading: boolean;
}

function ModelCatalogInner({ gatewayId, catalog, isLoading }: ModelCatalogInnerProps) {
  const persistedCatalog = useSessionQuery(api.llmAdmin.getCatalogQuery, { gatewayId });
  const [search, setSearch] = useState('');

  const providerSlugToId = useMemo(() => {
    if (!persistedCatalog) return new Map<string, string>();
    const map = new Map<string, string>();
    for (const provider of persistedCatalog) {
      map.set(provider.providerSlug, provider.providerId);
    }
    return map;
  }, [persistedCatalog]);

  const groups = useMemo(() => {
    if (!catalog) return [];
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
  const totalCount = catalog?.length ?? 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Available Models</CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-32" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-9 w-full" />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (catalog === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Available Models</CardTitle>
          <CardDescription>
            Click &ldquo;Sync available models&rdquo; above to load the catalog.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Available Models</CardTitle>
            <CardDescription>Enable models for use and set a default per provider</CardDescription>
          </div>
          <Badge variant="secondary">
            {enabledCount}/{totalCount}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {catalog.length === 0 ? (
          <p className="text-sm text-muted-foreground">No models returned by the gateway.</p>
        ) : (
          <>
            <div className="relative">
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

            {groups.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No models match &ldquo;{search}&rdquo;.
              </p>
            ) : (
              <div className="space-y-4">
                {groups.map((group) => {
                  const providerId = providerSlugToId.get(group.providerSlug);
                  if (!providerId) {
                    return (
                      <ProviderGroupShell
                        key={group.providerSlug}
                        providerSlug={group.providerSlug}
                        catalogModels={group.models}
                      />
                    );
                  }

                  return (
                    <ProviderGroup
                      key={group.providerSlug}
                      providerId={providerId}
                      providerSlug={group.providerSlug}
                      gatewayId={gatewayId}
                      catalogModels={group.models}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface ProviderGroupShellProps {
  providerSlug: string;
  catalogModels: GatewayModel[];
}

function ProviderGroupShell({ providerSlug, catalogModels }: ProviderGroupShellProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
        <span className="text-sm font-medium text-foreground capitalize">{providerSlug}</span>
        <Badge variant="secondary" className="text-xs">
          0/{catalogModels.length}
        </Badge>
      </div>
      {catalogModels.map((model) => (
        <div
          key={model.id}
          className="flex items-center justify-between rounded-md border px-3 py-2 opacity-60"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{model.name}</p>
            <p className="truncate font-mono text-xs text-muted-foreground">{model.id}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Switch disabled checked={false} aria-label={`Toggle ${model.name}`} />
            <RadioGroupItem
              value=""
              disabled
              checked={false}
              aria-label={`Set ${model.name} as default`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

interface ProviderGroupProps {
  providerId: string;
  providerSlug: string;
  gatewayId: Id<'llmGateways'>;
  catalogModels: GatewayModel[];
}

function ProviderGroup({ providerId, providerSlug, gatewayId, catalogModels }: ProviderGroupProps) {
  const persistedModels = useSessionQuery(api.llmAdmin.getModels, {
    providerId: providerId as Id<'llmProviders'>,
  });
  const enableModel = useSessionMutation(api.llmAdmin.setCatalogModelEnabled);
  const makeDefault = useSessionMutation(api.llmAdmin.makeDefaultModel);

  const [pendingModelSlug, setPendingModelSlug] = useState<string | null>(null);

  const handleToggle = useCallback(
    async (modelSlug: string, modelName: string) => {
      setPendingModelSlug(modelSlug);
      try {
        await enableModel({
          gatewayId,
          providerSlug,
          providerLabel: providerSlug,
          modelSlug,
          modelLabel: modelName,
        });
        toast.success(`${modelName} toggled`);
      } catch {
        toast.error(`Failed to toggle ${modelName}`);
      } finally {
        setPendingModelSlug(null);
      }
    },
    [enableModel, gatewayId, providerSlug]
  );

  const handleSetDefault = useCallback(
    async (modelId: Id<'llmModels'>) => {
      try {
        await makeDefault({
          modelId,
          providerId: providerId as Id<'llmProviders'>,
        });
        toast.success('Default model updated');
      } catch {
        toast.error('Failed to set default model');
      }
    },
    [makeDefault, providerId]
  );

  const persistedBySlug = useMemo(() => {
    if (!persistedModels) return new Map();
    const map = new Map<string, (typeof persistedModels)[number]>();
    for (const m of persistedModels) {
      map.set(m.slug, m);
    }
    return map;
  }, [persistedModels]);

  const enabledCount = useMemo(
    () => persistedModels?.filter((m) => m.isEnabled).length ?? 0,
    [persistedModels]
  );
  const totalCount = catalogModels.length;

  const defaultModelId = useMemo(
    () => persistedModels?.find((m) => m.isDefault)?._id ?? '',
    [persistedModels]
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
        <span className="text-sm font-medium text-foreground capitalize">{providerSlug}</span>
        <Badge variant="secondary" className="text-xs">
          {enabledCount}/{totalCount}
        </Badge>
      </div>

      <RadioGroup
        value={defaultModelId}
        onValueChange={(v) => handleSetDefault(v as Id<'llmModels'>)}
      >
        {catalogModels.map((model) => {
          const persisted = persistedBySlug.get(model.modelSlug);
          const isPersisted = !!persisted;
          const isEnabled = persisted?.isEnabled ?? false;
          const isPending = pendingModelSlug === model.modelSlug;

          return (
            <div
              key={model.id}
              className="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{model.name}</p>
                <p className="truncate font-mono text-xs text-muted-foreground">{model.id}</p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={() => handleToggle(model.modelSlug, model.name)}
                    aria-label={`Toggle ${model.name}`}
                  />
                )}

                <RadioGroupItem
                  value={isPersisted ? (persisted._id as string) : ''}
                  disabled={!isEnabled || !isPersisted}
                  aria-label={`Set ${model.name} as default`}
                />
              </div>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}

interface ModelCatalogProps {
  gatewayId: Id<'llmGateways'> | null;
  catalog: GatewayModel[] | null;
  isLoading: boolean;
}

export function ModelCatalog({ gatewayId, catalog, isLoading }: ModelCatalogProps) {
  if (gatewayId === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Available Models</CardTitle>
          <CardDescription>Set up the gateway above to load available models.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return <ModelCatalogInner gatewayId={gatewayId} catalog={catalog} isLoading={isLoading} />;
}
