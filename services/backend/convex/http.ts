import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { type CoreMessage, streamText } from 'ai';
import { httpRouter } from 'convex/server';
import { api } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { httpAction } from './_generated/server';
import { DEFAULT_MODEL_ID, isValidModelId } from './models';

const http = httpRouter();

// Streaming chat endpoint - OPTIONS handler for CORS preflight
http.route({
  path: '/chat/stream',
  method: 'OPTIONS',
  handler: httpAction(async (_, request) => {
    const headers = request.headers;
    return new Response(null, {
      status: 204,
      headers: {
        // Set CORS headers
        'Access-Control-Allow-Origin': headers.get('Origin') || '*', // Reflect origin or allow all
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers':
          headers.get('Access-Control-Request-Headers') || 'Content-Type',
        'Access-Control-Max-Age': '86400', // Cache preflight response for 24 hours
      },
    });
  }),
});

// Streaming chat endpoint
http.route({
  path: '/chat/stream',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    try {
      const { chatId, message, sessionId, attachments } = await request.json();

      // Validate required fields
      if (!chatId || !message || !sessionId) {
        return new Response('Missing required fields', { status: 400 });
      }

      // Verify the chat belongs to the authenticated user and get chat details
      const chatResult = await ctx.runQuery(api.chat.getChatSummary, {
        chatId,
        sessionId,
      });

      if (!chatResult.success || !chatResult.data) {
        return new Response('Chat not found or access denied', { status: 404 });
      }

      const chat = chatResult.data;

      // Get user's OpenRouter API key
      const apiKey = await ctx.runQuery(api.apiKeys.getDecryptedApiKey, {
        provider: 'openrouter',
        sessionId,
      });

      if (!apiKey) {
        return new Response('OpenRouter API key not configured', { status: 400 });
      }

      // Determine which model to use
      let modelToUse = chat.selectedModel || DEFAULT_MODEL_ID;

      // Validate the model ID and fallback to default if invalid
      if (!isValidModelId(modelToUse)) {
        console.warn(
          `Invalid model ID: ${modelToUse}, falling back to default: ${DEFAULT_MODEL_ID}`
        );
        modelToUse = DEFAULT_MODEL_ID;
      }

      // Send user message with attachments (if any)
      if (attachments && attachments.length > 0) {
        await ctx.runMutation(api.chat.sendMessageWithAttachments, {
          chatId,
          content: message,
          attachments,
          sessionId,
        });
      } else {
        await ctx.runMutation(api.chat.sendMessage, {
          chatId,
          content: message,
          sessionId,
        });
      }

      // Create initial streaming message
      const messageId = await ctx.runMutation(api.chat.createStreamingMessage, {
        chatId,
        sessionId,
      });

      // Get chat history for context
      const messagesResult = await ctx.runQuery(api.chat.getChatMessages, {
        chatId,
        sessionId,
      });

      // Check if the query was successful
      if (!messagesResult.success) {
        return new Response('Failed to get chat messages', { status: 403 });
      }

      // Convert to format expected by AI SDK
      const aiMessages: CoreMessage[] = await Promise.all(
        messagesResult.data
          .filter((m) => !m.isStreaming) // Exclude the current streaming message
          .map(async (m): Promise<CoreMessage> => {
            // If message has attachments, process them for AI models
            if (m.attachments && m.attachments.length > 0) {
              try {
                // Process attachments - for now, focus on the first attachment
                const firstAttachment = m.attachments[0];

                // Handle images for vision-capable models
                if (firstAttachment.metadata.type.startsWith('image/')) {
                  const fileUrl = await ctx.runQuery(api.chat.getFileUrl, {
                    storageId: firstAttachment.storageId as Id<'_storage'>,
                    sessionId,
                  });

                  if (fileUrl && m.role === 'user') {
                    return {
                      role: 'user',
                      content: [
                        {
                          type: 'text' as const,
                          text: m.content,
                        },
                        {
                          type: 'image' as const,
                          image: fileUrl,
                        },
                      ],
                    };
                  }
                }

                // Handle text files by including their content
                if (firstAttachment.metadata.type.startsWith('text/')) {
                  // For text files, we would need to read the content from storage
                  // For now, just include the filename in the message
                  const textContent = `${m.content}\n\n[Attached file: ${firstAttachment.metadata.name}]`;
                  return {
                    role: m.role,
                    content: textContent,
                  };
                }

                // For other file types, just mention the attachment
                const contentWithAttachment = `${m.content}\n\n[Attached file: ${firstAttachment.metadata.name} (${firstAttachment.metadata.type})]`;
                return {
                  role: m.role,
                  content: contentWithAttachment,
                };
              } catch (error) {
                console.warn('Failed to process attachment for message:', error);
                // Fall back to text-only message
              }
            }

            // Text-only message
            return {
              role: m.role,
              content: m.content,
            };
          })
      );

      // Add the current user message with attachments if present
      if (attachments && attachments.length > 0) {
        try {
          const firstAttachment = attachments[0];

          // Handle images for vision-capable models
          if (firstAttachment.metadata.type.startsWith('image/')) {
            const fileUrl = await ctx.runQuery(api.chat.getFileUrl, {
              storageId: firstAttachment.storageId as Id<'_storage'>,
              sessionId,
            });

            if (fileUrl) {
              aiMessages.push({
                role: 'user',
                content: [
                  {
                    type: 'text' as const,
                    text: message,
                  },
                  {
                    type: 'image' as const,
                    image: fileUrl,
                  },
                ],
              });
            } else {
              // Fall back to text-only if file URL generation fails
              aiMessages.push({
                role: 'user',
                content: message,
              });
            }
          } else {
            // For non-image files, include filename in the message
            const messageWithAttachment = `${message}\n\n[Attached file: ${firstAttachment.metadata.name} (${firstAttachment.metadata.type})]`;
            aiMessages.push({
              role: 'user',
              content: messageWithAttachment,
            });
          }
        } catch (error) {
          console.warn('Failed to process attachment for current message:', error);
          // Fall back to text-only message
          aiMessages.push({
            role: 'user',
            content: message,
          });
        }
      } else {
        // Text-only message
        aiMessages.push({
          role: 'user',
          content: message,
        });
      }

      // Initialize OpenRouter provider
      const openrouter = createOpenRouter({
        apiKey,
      });

      // Stream response using the selected model
      const result = await streamText({
        model: openrouter(modelToUse),
        messages: aiMessages,
      });

      // Create a readable stream for the response
      const stream = new ReadableStream({
        async start(controller) {
          let fullContent = '';

          try {
            for await (const chunk of result.textStream) {
              fullContent += chunk;

              // Send chunk to client
              const data = JSON.stringify({
                type: 'chunk',
                content: chunk,
                fullContent,
              });
              controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));

              // Update database every 10 words
              const wordCount = fullContent.split(/\s+/).length;
              if (wordCount % 10 === 0) {
                await ctx.runMutation(api.chat.updateStreamingMessage, {
                  messageId,
                  content: fullContent,
                  sessionId,
                });
              }
            }

            // Finalize the message with the model used
            await ctx.runMutation(api.chat.finalizeStreamingMessage, {
              messageId,
              finalContent: fullContent,
              modelUsed: modelToUse,
              sessionId,
            });

            // Track model usage for custom models
            try {
              await ctx.runMutation(api.models.incrementModelUsage, {
                modelId: modelToUse,
                sessionId,
              });
            } catch (error) {
              // Ignore errors for model usage tracking (non-critical)
              console.log('Model usage tracking failed (non-critical):', error);
            }

            // Send completion signal
            const completeData = JSON.stringify({
              type: 'complete',
              content: fullContent,
            });
            controller.enqueue(new TextEncoder().encode(`data: ${completeData}\n\n`));
          } catch (error) {
            console.error('Streaming error:', error);
            const errorData = JSON.stringify({
              type: 'error',
              error: 'Streaming failed',
            });
            controller.enqueue(new TextEncoder().encode(`data: ${errorData}\n\n`));
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    } catch (error) {
      console.error('Chat stream error:', error);
      return new Response('Internal server error', { status: 500 });
    }
  }),
});

export default http;
