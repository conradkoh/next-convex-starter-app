export const LLM_GATEWAY_KINDS = ['vercel-ai-gateway'] as const;

export type LLMGatewayKind = (typeof LLM_GATEWAY_KINDS)[number];

export interface LLMGateway {
  kind: LLMGatewayKind;
  label: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export function makeLLMGateway(params: {
  kind: LLMGatewayKind;
  label: string;
  isActive?: boolean;
}): Omit<LLMGateway, 'createdAt' | 'updatedAt'> & { createdAt: number; updatedAt: number } {
  const now = Date.now();
  return {
    kind: params.kind,
    label: params.label,
    isActive: params.isActive ?? false,
    createdAt: now,
    updatedAt: now,
  };
}
