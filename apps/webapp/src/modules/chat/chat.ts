import { api } from '@workspace/backend/convex/_generated/api';
import type { Id } from '@workspace/backend/convex/_generated/dataModel';
import { useSessionId, useSessionMutation, useSessionQuery } from 'convex-helpers/react/sessions';
import { useQuery } from 'convex/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export interface ChatMessage {
  _id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  isStreaming?: boolean;
  modelUsed: string;
}

export interface Chat {
  _id: Id<'chats'>;
  createdAt: number;
  updatedAt: number;
  userId: Id<'users'>;
}

export function useChat() {
  const [currentChatId, setCurrentChatId] = useState<Id<'chats'> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingAbortController, setStreamingAbortController] = useState<AbortController | null>(
    null
  );

  // Get session ID from convex-helpers
  const [sessionId] = useSessionId();

  // Get the latest chat for the user
  const latestChatResult = useSessionQuery(api.chat.getLatestChat);

  // Get messages for the current chat
  const messagesResult = useSessionQuery(
    api.chat.getChatMessages,
    currentChatId ? { chatId: currentChatId } : 'skip'
  );

  // Get API key status
  const apiKeyResult = useSessionQuery(api.apiKeys.getUserApiKey, { provider: 'openrouter' });

  // Get available models
  const availableModelsResult = useQuery(api.models.getAvailableModels);

  // Get user's preferred model
  const userPreferencesResult = useSessionQuery(api.models.getUserPreferredModel);

  // Get current chat details (including selected model)
  const currentChatResult = useSessionQuery(
    api.chat.getChatSummary,
    currentChatId ? { chatId: currentChatId } : 'skip'
  );

  // Mutations
  const createChatMutation = useSessionMutation(api.chat.createChat);
  const updateChatModelMutation = useSessionMutation(api.chat.updateChatModel);
  const setUserPreferredModelMutation = useSessionMutation(api.models.setUserPreferredModel);
  const loginAnonMutation = useSessionMutation(api.auth.loginAnon);

  // Extract data from results, handling errors
  const latestChat = latestChatResult?.success ? latestChatResult.data : null;
  const messages = messagesResult?.success ? messagesResult.data : [];
  const currentChat = currentChatResult?.success ? currentChatResult.data : null;

  // User preferences are returned directly when successful, null when auth fails
  const userPreferences = userPreferencesResult || null;

  // Ensure we have required model data before rendering
  const availableModels = availableModelsResult;
  const defaultModelId = availableModels?.defaultModelId || 'google/gemini-2.5-flash-preview-05-20';

  // Get the selected model for the current chat, falling back to user preference, then default
  const selectedModel =
    currentChat?.selectedModel || userPreferences?.preferredModelId || defaultModelId;

  // Don't render until we have essential model data
  const isModelDataReady = Boolean(availableModels && selectedModel);

  // Handle authentication errors from queries
  useEffect(() => {
    if (latestChatResult && !latestChatResult.success) {
      if (
        latestChatResult.error === 'session_not_found' ||
        latestChatResult.error === 'user_not_found'
      ) {
        // Don't show error toast for auth issues - the UI will handle this
        console.log('Authentication required for chat');
      }
    }
  }, [latestChatResult]);

  useEffect(() => {
    if (messagesResult && !messagesResult.success) {
      if (
        messagesResult.error === 'session_not_found' ||
        messagesResult.error === 'user_not_found'
      ) {
        // Don't show error toast for auth issues - the UI will handle this
        console.log('Authentication required for messages');
      } else if (messagesResult.error === 'unauthorized') {
        toast.error('You can only access your own chats');
      } else if (messagesResult.error === 'chat_not_found') {
        toast.error('Chat not found');
      }
    }
  }, [messagesResult]);

  // Set current chat when latest chat is loaded
  useEffect(() => {
    if (latestChat && !currentChatId) {
      setCurrentChatId(latestChat._id as Id<'chats'>);
    }
  }, [latestChat, currentChatId]);

  // Auto-login anonymously if user is not authenticated
  const performAutoLogin = useCallback(async () => {
    if (!sessionId) {
      console.log('No session ID available for auto-login');
      return false;
    }

    try {
      console.log('Attempting automatic anonymous login...');
      await loginAnonMutation();
      console.log('Automatic anonymous login successful');
      return true;
    } catch (error) {
      console.error('Automatic anonymous login failed:', error);
      return false;
    }
  }, [sessionId, loginAnonMutation]);

  const setSelectedModel = useCallback(
    async (modelId: string) => {
      try {
        // Always save as user preference for future chats
        await setUserPreferredModelMutation({
          modelId: modelId,
        });

        // If there's a current chat, also update the chat's selected model
        if (currentChatId) {
          await updateChatModelMutation({
            chatId: currentChatId,
            selectedModel: modelId,
          });
        }
      } catch (error) {
        console.error('Failed to update model selection:', error);
        toast.error('Failed to update model selection');
      }
    },
    [currentChatId, updateChatModelMutation, setUserPreferredModelMutation]
  );

  const createNewChat = useCallback(
    async (withModel?: string) => {
      try {
        setIsLoading(true);

        // Check if we need to auto-login first
        const hasAuthError =
          latestChatResult &&
          !latestChatResult.success &&
          (latestChatResult.error === 'session_not_found' ||
            latestChatResult.error === 'user_not_found');

        if (hasAuthError) {
          const loginSuccess = await performAutoLogin();
          if (!loginSuccess) {
            throw new Error('Authentication required. Please refresh the page and try again.');
          }
          // Wait a moment for the auth state to update
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        // Use the provided model, current selected model, or default
        const modelToUse = withModel || selectedModel;

        const chatId = await createChatMutation({
          selectedModel: modelToUse,
        });
        setCurrentChatId(chatId);
        return chatId;
      } catch (error) {
        console.error('Failed to create chat:', error);
        const errorMessage = (error as Error).message;
        if (errorMessage.includes('Session not found') || errorMessage.includes('User not found')) {
          toast.error('Please refresh the page and try again');
        } else {
          toast.error('Failed to create chat');
        }
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [createChatMutation, latestChatResult, performAutoLogin, selectedModel]
  );

  const sendStreamingMessage = useCallback(
    async (content: string) => {
      // Check if user has API key configured
      if (!apiKeyResult || !apiKeyResult.hasKey) {
        toast.error('Please configure your OpenRouter API key in settings');
        return;
      }

      // Check if session ID is available
      if (!sessionId) {
        toast.error('Session not initialized. Please refresh the page.');
        return;
      }

      // Create abort controller for this request
      const abortController = new AbortController();
      setStreamingAbortController(abortController);

      try {
        setIsStreaming(true);

        // Check if we need to auto-login first
        const hasAuthError =
          latestChatResult &&
          !latestChatResult.success &&
          (latestChatResult.error === 'session_not_found' ||
            latestChatResult.error === 'user_not_found');

        if (hasAuthError) {
          const loginSuccess = await performAutoLogin();
          if (!loginSuccess) {
            throw new Error('Authentication required. Please refresh the page and try again.');
          }
          // Wait a moment for the auth state to update
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        // Create a new chat if none exists
        let chatId = currentChatId;
        if (!chatId) {
          chatId = await createNewChat();
        }

        if (!chatId) {
          throw new Error('Failed to get or create chat');
        }

        // Check if CONVEX_SITE_URL is configured for HTTP actions
        if (!process.env.NEXT_PUBLIC_CONVEX_SITE_URL) {
          throw new Error(
            'NEXT_PUBLIC_CONVEX_SITE_URL environment variable is required for streaming chat. Please add it to your .env.local file.'
          );
        }

        // Call the streaming endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_CONVEX_SITE_URL}/chat/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatId,
            message: content,
            sessionId,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        if (!response.body) {
          throw new Error('No response body');
        }

        // Handle Server-Sent Events
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.type === 'chunk') {
                    // Handle streaming chunk - the database is updated automatically
                    // The UI will update via the Convex query reactivity
                  } else if (data.type === 'complete') {
                    // Streaming complete
                    // console.log('Streaming complete');
                  } else if (data.type === 'error') {
                    throw new Error(data.error);
                  }
                } catch (parseError) {
                  console.error('Failed to parse SSE data:', parseError);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } catch (error) {
        // Check if the error is due to abort
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Streaming was stopped by user');
          return;
        }

        console.error('Failed to send streaming message:', error);
        const errorMessage = (error as Error).message;

        if (errorMessage.includes('API key not configured')) {
          toast.error('Please configure your OpenRouter API key in settings');
        } else if (
          errorMessage.includes('Session not found') ||
          errorMessage.includes('User not found')
        ) {
          toast.error('Please refresh the page and try again');
        } else if (errorMessage.includes('Chat not found')) {
          toast.error('Chat not found or access denied');
        } else {
          toast.error('Failed to send message');
        }
      } finally {
        setIsStreaming(false);
        setStreamingAbortController(null);
      }
    },
    [currentChatId, createNewChat, apiKeyResult, sessionId, latestChatResult, performAutoLogin]
  );

  const stopStreaming = useCallback(() => {
    if (streamingAbortController) {
      streamingAbortController.abort();
      setStreamingAbortController(null);
      setIsStreaming(false);
    }
  }, [streamingAbortController]);

  // Check if we have authentication errors
  const hasAuthError =
    (latestChatResult &&
      !latestChatResult.success &&
      (latestChatResult.error === 'session_not_found' ||
        latestChatResult.error === 'user_not_found')) ||
    (messagesResult &&
      !messagesResult.success &&
      (messagesResult.error === 'session_not_found' || messagesResult.error === 'user_not_found'));

  // Check if messages query is loading (undefined means still loading)
  const isMessagesLoading = Boolean(currentChatId && messagesResult === undefined);

  return {
    currentChatId,
    messages: messages || [],
    isLoading: isLoading || isStreaming,
    createNewChat,
    setCurrentChatId,
    hasAuthError: Boolean(hasAuthError),
    sendStreamingMessage,
    stopStreaming,
    isStreaming,
    hasApiKey: Boolean(apiKeyResult?.hasKey),
    isMessagesLoading,
    selectedModel,
    setSelectedModel,
    availableModels,
    isModelDataReady,
  };
}
