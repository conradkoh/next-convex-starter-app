import type { Id } from '../../../convex/_generated/dataModel';

export interface LLMModel {
  providerId: Id<'llmProviders'>;
  slug: string;
  label: string;
  isEnabled: boolean;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

export function makeLLMModel(params: {
  providerId: Id<'llmProviders'>;
  slug: string;
  label: string;
  isEnabled?: boolean;
  isDefault?: boolean;
}): Omit<LLMModel, 'createdAt' | 'updatedAt'> & { createdAt: number; updatedAt: number } {
  const now = Date.now();
  return {
    providerId: params.providerId,
    slug: params.slug,
    label: params.label,
    isEnabled: params.isEnabled ?? true,
    isDefault: params.isDefault ?? false,
    createdAt: now,
    updatedAt: now,
  };
}
