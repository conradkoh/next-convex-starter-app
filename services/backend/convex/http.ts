import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';
import { httpRouter } from 'convex/server';
import { api } from './_generated/api';
import { httpAction } from './_generated/server';

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
      const body = await request.json();
      const { chatId, message, sessionId } = body;

      // Validate input
      if (!chatId || !message || !sessionId) {
        return new Response('Missing required fields', { status: 400 });
      }

      // Verify the chat belongs to the authenticated user
      const chatResult = await ctx.runQuery(api.chat.getChatSummary, {
        chatId,
        sessionId,
      });

      if (!chatResult.success || !chatResult.data) {
        return new Response('Chat not found or access denied', { status: 404 });
      }

      // Get user's OpenRouter API key
      const apiKey = await ctx.runQuery(api.apiKeys.getDecryptedApiKey, {
        provider: 'openrouter',
        sessionId,
      });

      if (!apiKey) {
        return new Response('OpenRouter API key not configured', { status: 400 });
      }

      // Add user message to chat (this will handle auth internally)
      await ctx.runMutation(api.chat.sendMessage, {
        chatId,
        content: message,
        sessionId,
      });

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
      const aiMessages = messagesResult.data
        .filter((m) => !m.isStreaming) // Exclude the current streaming message
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      // Add the current user message
      aiMessages.push({
        role: 'user',
        content: message,
      });

      // Initialize OpenRouter provider
      const openrouter = createOpenRouter({
        apiKey,
      });

      // Stream response
      const result = await streamText({
        model: openrouter('google/gemini-2.5-flash-preview-05-20'),
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

            // Finalize the message
            await ctx.runMutation(api.chat.finalizeStreamingMessage, {
              messageId,
              finalContent: fullContent,
              sessionId,
            });

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
