/**
 * Persistent Streaming Helper
 *
 * Wires {@link LLMGatewayPort.streamText} output into the Convex
 * `persistent-text-streaming` component's chunkAppender callback.
 *
 * ## When to use
 *
 * Use this helper inside Convex HTTP actions when you need to stream
 * LLM-generated text to clients while simultaneously persisting it in
 * the database. The component handles both the HTTP response streaming
 * and durable storage, so the stream survives disconnects, page reloads,
 * and can be queried by other users.
 *
 * ## Usage pattern
 *
 * ```ts
 * const streaming = new PersistentTextStreaming(components.persistentTextStreaming);
 * const port = getLLMGateway();
 *
 * export const myStreamAction = httpAction(async (ctx, request) => {
 *   const { streamId } = await request.json();
 *   return streaming.stream(ctx, request, streamId, async (_ctx, _req, _id, append) => {
 *     await streamLLMToAppender(port, { modelSlug: "gpt-4o", providerSlug: "openai", prompt: "..." }, append);
 *   });
 * });
 * ```
 */

import type { LLMGatewayPort, LLMGenerateTextRequest } from '../ports/llmGatewayPort';

export async function streamLLMToAppender(
  port: LLMGatewayPort,
  request: LLMGenerateTextRequest,
  append: (text: string) => Promise<void>
): Promise<void> {
  for await (const chunk of port.streamText(request)) {
    if (!chunk.done && chunk.delta) {
      await append(chunk.delta);
    }
  }
}
