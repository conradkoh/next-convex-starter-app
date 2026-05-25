'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import type { Id } from '@workspace/backend/convex/_generated/dataModel';
import { useSessionMutation, useSessionQuery } from 'convex-helpers/react/sessions';
import { Plus } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ProviderSectionProps {
  gatewayId: Id<'llmGateways'> | null;
  selectedProviderId: string | null;
  onProviderSelect: (providerId: string | null) => void;
}

export function ProviderSection({
  gatewayId,
  selectedProviderId,
  onProviderSelect,
}: ProviderSectionProps) {
  const providers = useSessionQuery(api.llmAdmin.getProviders, gatewayId ? { gatewayId } : 'skip');
  const enableProvider = useSessionMutation(api.llmAdmin.enableProvider);
  const createProvider = useSessionMutation(api.llmAdmin.createOrUpdateProvider);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [slug, setSlug] = useState('');
  const [label, setLabel] = useState('');
  const [apiKeyEnvVar, setApiKeyEnvVar] = useState('');

  const handleToggle = useCallback(
    async (providerId: string, enabled: boolean) => {
      try {
        await enableProvider({ providerId: providerId as Id<'llmProviders'>, enabled });
        toast.success(enabled ? 'Provider enabled' : 'Provider disabled');
      } catch {
        toast.error('Failed to update provider');
      }
    },
    [enableProvider]
  );

  const handleAdd = useCallback(async () => {
    if (!slug.trim() || !label.trim() || !gatewayId) return;
    try {
      await createProvider({
        gatewayId,
        slug: slug.trim(),
        label: label.trim(),
        apiKeyEnvVar: apiKeyEnvVar.trim() || undefined,
      });
      toast.success('Provider added');
      setDialogOpen(false);
      setSlug('');
      setLabel('');
      setApiKeyEnvVar('');
    } catch {
      toast.error('Failed to add provider');
    }
  }, [slug, label, apiKeyEnvVar, gatewayId, createProvider]);

  if (providers === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-32" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-48" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!gatewayId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Providers</CardTitle>
          <CardDescription>Select an active gateway first</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No active gateway selected.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Providers</CardTitle>
            <CardDescription>Manage LLM providers for the active gateway</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Provider
          </Button>
        </CardHeader>
        <CardContent>
          {providers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No providers configured.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Slug</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>API Key Env</TableHead>
                  <TableHead className="w-24">Enabled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.map((p) => (
                  <TableRow
                    key={p._id}
                    className={`cursor-pointer hover:bg-accent/50 ${selectedProviderId === p._id ? 'bg-accent' : ''}`}
                    onClick={() => onProviderSelect(selectedProviderId === p._id ? null : p._id)}
                  >
                    <TableCell className="font-mono text-sm">{p.slug}</TableCell>
                    <TableCell>{p.label}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {p.apiKeyEnvVar || '—'}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={p.isEnabled}
                        onCheckedChange={(checked) => handleToggle(p._id, checked)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Provider</DialogTitle>
            <DialogDescription>Add a new LLM provider to the active gateway</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="provider-slug">Slug</Label>
              <Input
                id="provider-slug"
                placeholder="openai"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider-label">Label</Label>
              <Input
                id="provider-label"
                placeholder="OpenAI"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider-env">API Key Environment Variable (optional)</Label>
              <Input
                id="provider-env"
                placeholder="OPENAI_API_KEY"
                value={apiKeyEnvVar}
                onChange={(e) => setApiKeyEnvVar(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!slug.trim() || !label.trim()}>
              Add Provider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
