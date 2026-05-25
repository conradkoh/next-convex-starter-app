import { describe, expect, it } from 'vitest';

import { getLLMGateway } from '../index';
import type { LLMGatewayPort } from '../ports/llmGatewayPort';

describe('getLLMGateway', () => {
  it('returns an object implementing LLMGatewayPort', () => {
    const gateway: LLMGatewayPort = getLLMGateway();
    expect(gateway).toBeDefined();
    expect(typeof gateway.generateText).toBe('function');
    expect(typeof gateway.streamText).toBe('function');
  });

  it('returns the same instance on repeated calls', () => {
    const a = getLLMGateway();
    const b = getLLMGateway();
    expect(a).toBe(b);
  });
});
