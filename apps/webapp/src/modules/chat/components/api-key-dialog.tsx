'use client';

import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@workspace/backend/convex/_generated/api';
import { useSessionMutation, useSessionQuery } from 'convex-helpers/react/sessions';
import { Eye, EyeOff, Key, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

/**
 * Props for the ApiKeyDialog component
 */
interface ApiKeyDialogProps {
  /** Whether the dialog is currently open */
  open: boolean;
  /** Callback function called when the dialog open state changes */
  onOpenChange: (open: boolean) => void;
}

/**
 * ApiKeyDialog component provides a modal interface for managing AI provider API keys.
 * Features include secure key storage, validation, provider selection, and key deletion.
 * Currently supports OpenRouter with extensible architecture for additional providers.
 *
 * @param props - The component props
 * @returns JSX element representing the API key management dialog
 */
export function ApiKeyDialog({ open, onOpenChange }: ApiKeyDialogProps) {
  const [provider, setProvider] = useState<'openrouter'>('openrouter');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get existing API key info
  const existingKey = useSessionQuery(api.apiKeys.getUserApiKey, open ? { provider } : 'skip');

  // Mutations
  const setApiKeyMutation = useSessionMutation(api.apiKeys.setUserApiKey);
  const deleteApiKeyMutation = useSessionMutation(api.apiKeys.deleteUserApiKey);

  const handleSave = useCallback(async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    if (!apiKey.startsWith('sk-or-')) {
      toast.error('OpenRouter API keys should start with "sk-or-"');
      return;
    }

    try {
      setIsLoading(true);
      await setApiKeyMutation({
        provider,
        apiKey: apiKey.trim(),
      });
      toast.success('API key saved successfully');
      setApiKey('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save API key:', error);
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('Session not found') || errorMessage.includes('User not found')) {
        toast.error('Please log in to save API keys');
      } else {
        toast.error('Failed to save API key');
      }
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, provider, setApiKeyMutation, onOpenChange]);

  const handleDelete = useCallback(async () => {
    if (!existingKey) {
      return;
    }

    try {
      setIsLoading(true);
      await deleteApiKeyMutation({ provider });
      toast.success('API key deleted successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to delete API key:', error);
      toast.error('Failed to delete API key');
    } finally {
      setIsLoading(false);
    }
  }, [existingKey, provider, deleteApiKeyMutation, onOpenChange]);

  const handleClose = useCallback(() => {
    setApiKey('');
    setShowApiKey(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const handleApiKeyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  }, []);

  const handleToggleShowApiKey = useCallback(() => {
    setShowApiKey(!showApiKey);
  }, [showApiKey]);

  const handleProviderChange = useCallback((value: 'openrouter') => {
    setProvider(value);
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Key Management
          </DialogTitle>
          <DialogDescription>
            Configure your AI provider API keys. These keys are stored securely and used to access
            AI models.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="provider">Provider</Label>
            <Select value={provider} onValueChange={handleProviderChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openrouter">OpenRouter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {existingKey && (
            <div className="rounded-lg border p-3 bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Current API Key</p>
                  <p className="text-xs text-muted-foreground">
                    Added {new Date(existingKey.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="apiKey">{existingKey ? 'New API Key' : 'API Key'}</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                placeholder="sk-or-..."
                value={apiKey}
                onChange={handleApiKeyChange}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={handleToggleShowApiKey}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Get your API key from{' '}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                OpenRouter Dashboard
              </a>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !apiKey.trim()}>
            {isLoading ? 'Saving...' : 'Save API Key'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
