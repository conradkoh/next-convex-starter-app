export interface LLMGenerateTextRequest {
  modelSlug: string;
  providerSlug: string;
  prompt: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMGenerateTextResult {
  text: string;
  usage?: { promptTokens: number; completionTokens: number };
}

export interface LLMStreamTextChunk {
  delta: string;
  done: boolean;
}

export interface LLMGatewayModel {
  id: string;
  name: string;
  providerSlug: string;
  modelSlug: string;
}

export interface LLMGatewayPort {
  generateText(req: LLMGenerateTextRequest): Promise<LLMGenerateTextResult>;
  streamText(req: LLMGenerateTextRequest): AsyncIterable<LLMStreamTextChunk>;
  listAvailableModels(): Promise<LLMGatewayModel[]>;
}
