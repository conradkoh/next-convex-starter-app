import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';

import type {
  LLMGatewayPort,
  LLMGenerateTextRequest,
  LLMGenerateTextResult,
  LLMStreamTextChunk,
} from '../ports/llmGatewayPort';

const PROVIDER_FACTORIES: Record<string, (apiKey?: string) => ReturnType<typeof createOpenAI>> = {
  openai: (apiKey?: string) =>
    createOpenAI({
      apiKey: apiKey ?? process.env.OPENAI_API_KEY,
    }),
};

export class VercelAIGatewayAdapter implements LLMGatewayPort {
  private apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async generateText(req: LLMGenerateTextRequest): Promise<LLMGenerateTextResult> {
    const provider = this.getProvider(req.providerSlug);
    const result = await generateText({
      model: provider(req.modelSlug),
      prompt: req.prompt,
      system: req.system,
      temperature: req.temperature,
      maxOutputTokens: req.maxTokens,
    });
    return {
      text: result.text,
      usage: result.usage
        ? {
            promptTokens: result.usage.inputTokens ?? 0,
            completionTokens: result.usage.outputTokens ?? 0,
          }
        : undefined,
    };
  }

  async *streamText(req: LLMGenerateTextRequest): AsyncIterable<LLMStreamTextChunk> {
    const provider = this.getProvider(req.providerSlug);
    const result = streamText({
      model: provider(req.modelSlug),
      prompt: req.prompt,
      system: req.system,
      temperature: req.temperature,
      maxOutputTokens: req.maxTokens,
    });
    for await (const chunk of result.textStream) {
      yield { delta: chunk, done: false };
    }
    yield { delta: '', done: true };
  }

  private getProvider(providerSlug: string) {
    const factory = PROVIDER_FACTORIES[providerSlug];
    if (!factory) {
      throw new Error(`Unsupported LLM provider: ${providerSlug}`);
    }
    return factory(this.apiKey);
  }
}
