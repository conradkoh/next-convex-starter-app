import { VercelAIGatewayAdapter } from './adapters/vercelAIGatewayAdapter';
import type { LLMGatewayPort } from './ports/llmGatewayPort';

export type { LLMGatewayPort } from './ports/llmGatewayPort';

let cachedGateway: LLMGatewayPort | null = null;

export function getLLMGateway(): LLMGatewayPort {
  if (!cachedGateway) {
    cachedGateway = new VercelAIGatewayAdapter();
  }
  return cachedGateway;
}
