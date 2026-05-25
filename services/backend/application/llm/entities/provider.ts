import type { Id } from '../../../convex/_generated/dataModel';

export interface LLMProvider {
  gatewayId: Id<'llmGateways'>;
  slug: string;
  label: string;
  apiKeyEnvVar?: string;
  isEnabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export function makeLLMProvider(params: {
  gatewayId: Id<'llmGateways'>;
  slug: string;
  label: string;
  apiKeyEnvVar?: string;
  isEnabled?: boolean;
}): Omit<LLMProvider, 'createdAt' | 'updatedAt'> & { createdAt: number; updatedAt: number } {
  const now = Date.now();
  return {
    gatewayId: params.gatewayId,
    slug: params.slug,
    label: params.label,
    apiKeyEnvVar: params.apiKeyEnvVar,
    isEnabled: params.isEnabled ?? true,
    createdAt: now,
    updatedAt: now,
  };
}
