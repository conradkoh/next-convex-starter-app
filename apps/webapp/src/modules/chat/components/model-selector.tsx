'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Brain, Plus } from 'lucide-react';
import { useCallback, useState } from 'react';

/**
 * Model interface matching the backend ChatModel type
 */
interface ChatModel {
  id: string;
  name: string;
  category: 'fast' | 'smart';
  provider: string;
  description?: string;
}

/**
 * Props for the ModelSelector component
 */
interface ModelSelectorProps {
  /** Currently selected model ID */
  selectedModel?: string;
  /** Available models organized by category */
  availableModels?: {
    defaultModels: ChatModel[];
    defaultCategories: { [K in 'fast' | 'smart']: ChatModel[] };
    extendedModels: ChatModel[];
    extendedCategories: { [K in 'fast' | 'smart']: ChatModel[] };
    defaultModelId: string;
  };
  /** Callback function called when model selection changes */
  onModelChange: (modelId: string) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Whether thinking mode is enabled */
  thinkingMode?: boolean;
  /** Callback for thinking mode toggle */
  onThinkingModeChange?: (enabled: boolean) => void;
}

/**
 * ModelSelector component provides a compact dropdown for selecting AI models.
 * Supports both curated default models and custom model input with search.
 *
 * Features:
 * - Curated default models for easy selection
 * - Custom model input for advanced users
 * - Search functionality across all available models
 * - Thinking mode toggle for supported models
 * - Modern styling with proper borders and spacing
 *
 * @param props - The component props
 * @returns JSX element representing the enhanced model selector
 */
export function ModelSelector({
  selectedModel,
  availableModels,
  onModelChange,
  disabled = false,
  isLoading = false,
  thinkingMode = false,
  onThinkingModeChange,
}: ModelSelectorProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customModelId, setCustomModelId] = useState('');

  const handleValueChange = useCallback(
    (value: string) => {
      if (value === 'custom') {
        setShowCustomInput(true);
        return;
      }
      onModelChange(value);
    },
    [onModelChange]
  );

  const handleCustomModelSubmit = useCallback(() => {
    if (customModelId.trim()) {
      onModelChange(customModelId.trim());
      setCustomModelId('');
      setShowCustomInput(false);
    }
  }, [customModelId, onModelChange]);

  const handleCustomModelKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCustomModelSubmit();
      } else if (e.key === 'Escape') {
        setCustomModelId('');
        setShowCustomInput(false);
      }
    },
    [handleCustomModelSubmit]
  );

  // Helper function to find model details by ID from all available models
  const findModelById = useCallback(
    (modelId: string): ChatModel | null => {
      if (!availableModels) return null;

      // First check default models
      const defaultModel = availableModels.defaultModels.find((model) => model.id === modelId);
      if (defaultModel) return defaultModel;

      // Then check extended models
      const extendedModel = availableModels.extendedModels.find((model) => model.id === modelId);
      if (extendedModel) return extendedModel;

      return null;
    },
    [availableModels]
  );

  // Check if current model supports thinking mode (based on model ID containing 'thinking')
  const supportsThinking = useCallback((modelId: string) => {
    return modelId.includes(':thinking') || modelId.includes('o1') || modelId.includes('reasoning');
  }, []);

  const currentModelId = selectedModel || availableModels?.defaultModelId || '';
  const selectedModelDetails = findModelById(currentModelId);
  const hasThinkingSupport = supportsThinking(currentModelId);

  // Show loading state
  if (isLoading || !availableModels) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground border rounded-md bg-background min-w-[120px] max-w-[180px] h-7">
        <span>Loading...</span>
      </div>
    );
  }

  // Get display name from model details or fallback to model ID
  const displayName = selectedModelDetails
    ? selectedModelDetails.name
    : currentModelId.split('/').pop() || currentModelId;

  // Show custom input if active
  if (showCustomInput) {
    return (
      <div className="flex items-center gap-1 min-w-[120px] max-w-[180px]">
        <Input
          value={customModelId}
          onChange={(e) => setCustomModelId(e.target.value)}
          onKeyDown={handleCustomModelKeyDown}
          placeholder="provider/model-name"
          className="h-7 text-xs px-2"
          autoFocus
        />
        <Button
          size="sm"
          onClick={handleCustomModelSubmit}
          disabled={!customModelId.trim()}
          className="h-7 w-7 p-0"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={currentModelId} onValueChange={handleValueChange} disabled={disabled}>
        <SelectTrigger className="h-7 px-2 py-1 text-xs border bg-background hover:bg-muted/50 focus:bg-muted/50 w-[200px]">
          <SelectValue asChild>
            <span className="truncate font-medium text-foreground">{displayName}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="end" className="min-w-[250px]">
          {/* Default Fast Models Group */}
          {availableModels.defaultCategories.fast &&
            availableModels.defaultCategories.fast.length > 0 && (
              <SelectGroup>
                <SelectLabel className="text-xs font-medium text-foreground bg-muted/80 px-2 py-1.5 -mx-1 -mt-1 mb-1 rounded">
                  Fast Models
                </SelectLabel>
                {availableModels.defaultCategories.fast.map((model) => (
                  <SelectItem
                    key={model.id}
                    value={model.id}
                    className="text-sm py-2 cursor-pointer"
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{model.name}</span>
                        {supportsThinking(model.id) && (
                          <Brain className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      {model.description && (
                        <span className="text-xs text-muted-foreground">{model.description}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            )}

          {/* Default Smart Models Group */}
          {availableModels.defaultCategories.smart &&
            availableModels.defaultCategories.smart.length > 0 && (
              <SelectGroup>
                <SelectLabel className="text-xs font-medium text-foreground bg-muted/80 px-2 py-1.5 -mx-1 mb-1 rounded">
                  Smart Models
                </SelectLabel>
                {availableModels.defaultCategories.smart.map((model) => (
                  <SelectItem
                    key={model.id}
                    value={model.id}
                    className="text-sm py-2 cursor-pointer"
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{model.name}</span>
                        {supportsThinking(model.id) && (
                          <Brain className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      {model.description && (
                        <span className="text-xs text-muted-foreground">{model.description}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            )}

          {/* Custom Model Option */}
          <SelectGroup>
            <SelectLabel className="text-xs font-medium text-foreground bg-muted/80 px-2 py-1.5 -mx-1 mb-1 rounded">
              Custom
            </SelectLabel>
            <SelectItem value="custom" className="text-sm py-2 cursor-pointer">
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Plus className="h-3 w-3" />
                <span>Add Custom Model</span>
              </span>
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* Thinking Mode Toggle */}
      {hasThinkingSupport && onThinkingModeChange && (
        <div className="flex items-center gap-1.5">
          <Brain className="h-3 w-3 text-muted-foreground" />
          <Switch
            checked={thinkingMode}
            onCheckedChange={onThinkingModeChange}
            disabled={disabled}
            className="scale-75"
          />
          <span className="text-xs text-muted-foreground">Think</span>
        </div>
      )}
    </div>
  );
}
