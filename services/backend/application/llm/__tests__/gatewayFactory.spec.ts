import { describe, expect, it, vi } from 'vitest';

import { VercelAIGatewayAdapter } from '../adapters/vercelAIGatewayAdapter';
import { getLLMGateway } from '../index';
import type { LLMGatewayPort } from '../ports/llmGatewayPort';

vi.mock('ai', () => ({
  gateway: {
    getAvailableModels: vi.fn(),
  },
  generateText: vi.fn(),
  streamText: vi.fn(),
}));

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(),
}));

describe('getLLMGateway', () => {
  it('returns an object implementing LLMGatewayPort', () => {
    const gateway: LLMGatewayPort = getLLMGateway();
    expect(gateway).toBeDefined();
    expect(typeof gateway.generateText).toBe('function');
    expect(typeof gateway.streamText).toBe('function');
    expect(typeof gateway.listAvailableModels).toBe('function');
  });

  it('returns the same instance on repeated calls', () => {
    const a = getLLMGateway();
    const b = getLLMGateway();
    expect(a).toBe(b);
  });
});

describe('VercelAIGatewayAdapter.listAvailableModels', () => {
  it('splits model ids on first / to derive providerSlug and modelSlug', async () => {
    const { gateway: mockedGateway } = await import('ai');
    const mockModels = [
      { id: 'openai/gpt-4o', name: 'GPT-4o', specification: {} },
      { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', specification: {} },
      { id: 'meta/llama-4-maverick', name: 'Llama 4 Maverick', specification: {} },
    ];
    vi.mocked(mockedGateway.getAvailableModels).mockResolvedValue({
      models: mockModels as any,
    });

    const adapter = new VercelAIGatewayAdapter();
    const models = await adapter.listAvailableModels();

    expect(models).toHaveLength(3);
    expect(models[0]).toEqual({
      id: 'openai/gpt-4o',
      name: 'GPT-4o',
      providerSlug: 'openai',
      modelSlug: 'gpt-4o',
    });
    expect(models[1]).toEqual({
      id: 'anthropic/claude-sonnet-4',
      name: 'Claude Sonnet 4',
      providerSlug: 'anthropic',
      modelSlug: 'claude-sonnet-4',
    });
    expect(models[2]).toEqual({
      id: 'meta/llama-4-maverick',
      name: 'Llama 4 Maverick',
      providerSlug: 'meta',
      modelSlug: 'llama-4-maverick',
    });
  });
});
