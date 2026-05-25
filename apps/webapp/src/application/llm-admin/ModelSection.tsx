'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import type { Id } from '@workspace/backend/convex/_generated/dataModel';
import { useSessionMutation, useSessionQuery } from 'convex-helpers/react/sessions';
import { Plus, Star } from 'lucide-react';
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

interface ModelSectionProps {
  providerId: string | null;
}

export function ModelSection({ providerId }: ModelSectionProps) {
  const models = useSessionQuery(
    api.llmAdmin.getModels,
    providerId ? { providerId: providerId as Id<'llmProviders'> } : 'skip'
  );
  const enableModel = useSessionMutation(api.llmAdmin.enableModel);
  const createModel = useSessionMutation(api.llmAdmin.createOrUpdateModel);
  const makeDefault = useSessionMutation(api.llmAdmin.makeDefaultModel);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [slug, setSlug] = useState('');
  const [label, setLabel] = useState('');

  const handleToggle = useCallback(
    async (modelId: string, enabled: boolean) => {
      try {
        await enableModel({ modelId: modelId as Id<'llmModels'>, enabled });
        toast.success(enabled ? 'Model enabled' : 'Model disabled');
      } catch {
        toast.error('Failed to update model');
      }
    },
    [enableModel]
  );

  const handleSetDefault = useCallback(
    async (modelId: string) => {
      if (!providerId) return;
      try {
        await makeDefault({
          modelId: modelId as Id<'llmModels'>,
          providerId: providerId as Id<'llmProviders'>,
        });
        toast.success('Default model updated');
      } catch {
        toast.error('Failed to set default model');
      }
    },
    [makeDefault, providerId]
  );

  const handleAdd = useCallback(async () => {
    if (!slug.trim() || !label.trim() || !providerId) return;
    try {
      await createModel({
        providerId: providerId as Id<'llmProviders'>,
        slug: slug.trim(),
        label: label.trim(),
      });
      toast.success('Model added');
      setDialogOpen(false);
      setSlug('');
      setLabel('');
    } catch {
      toast.error('Failed to add model');
    }
  }, [slug, label, providerId, createModel]);

  if (models === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-24" />
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

  if (!providerId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Models</CardTitle>
          <CardDescription>Select a provider to manage its models</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No provider selected.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Models</CardTitle>
            <CardDescription>Manage LLM models for the selected provider</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Model
          </Button>
        </CardHeader>
        <CardContent>
          {models.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No models configured.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Slug</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead className="w-24">Enabled</TableHead>
                  <TableHead className="w-24">Default</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((m) => (
                  <TableRow key={m._id}>
                    <TableCell className="font-mono text-sm">{m.slug}</TableCell>
                    <TableCell>{m.label}</TableCell>
                    <TableCell>
                      <Switch
                        checked={m.isEnabled}
                        onCheckedChange={(checked) => handleToggle(m._id, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={m.isDefault ? 'default' : 'ghost'}
                        size="icon"
                        onClick={() => handleSetDefault(m._id)}
                        title={m.isDefault ? 'Current default' : 'Set as default'}
                      >
                        <Star className={`h-4 w-4 ${m.isDefault ? 'fill-current' : ''}`} />
                      </Button>
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
            <DialogTitle>Add Model</DialogTitle>
            <DialogDescription>Add a new LLM model to the selected provider</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="model-slug">Slug</Label>
              <Input
                id="model-slug"
                placeholder="gpt-4o"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model-label">Label</Label>
              <Input
                id="model-label"
                placeholder="GPT-4o"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!slug.trim() || !label.trim()}>
              Add Model
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
