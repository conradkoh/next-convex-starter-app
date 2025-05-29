import { api } from '@workspace/backend/convex/_generated/api';
import type { Id } from '@workspace/backend/convex/_generated/dataModel';
import { useSessionMutation, useSessionQuery } from 'convex-helpers/react/sessions';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export interface ChatMessage {
  _id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
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

  // Get the latest chat for the user
  const latestChat = useSessionQuery(api.chat.getLatestChat);

  // Get messages for the current chat
  const messages = useSessionQuery(
    api.chat.getChatMessages,
    currentChatId ? { chatId: currentChatId } : 'skip'
  );

  // Mutations
  const createChatMutation = useSessionMutation(api.chat.createChat);
  const sendMessageMutation = useSessionMutation(api.chat.sendMessage);

  // Set current chat when latest chat is loaded
  useEffect(() => {
    if (latestChat && !currentChatId) {
      setCurrentChatId(latestChat._id);
    }
  }, [latestChat, currentChatId]);

  const createNewChat = useCallback(async () => {
    try {
      setIsLoading(true);
      const chatId = await createChatMutation({});
      setCurrentChatId(chatId);
      return chatId;
    } catch (error) {
      console.error('Failed to create chat:', error);
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('Session not found') || errorMessage.includes('User not found')) {
        toast.error('Please log in to use chat');
      } else {
        toast.error('Failed to create chat');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [createChatMutation]);

  const sendMessage = useCallback(
    async (content: string) => {
      try {
        setIsLoading(true);

        // Create a new chat if none exists
        let chatId = currentChatId;
        if (!chatId) {
          chatId = await createNewChat();
        }

        if (!chatId) {
          throw new Error('Failed to get or create chat');
        }

        await sendMessageMutation({
          chatId,
          content,
        });
      } catch (error) {
        console.error('Failed to send message:', error);
        const errorMessage = (error as Error).message;
        if (errorMessage.includes('Session not found') || errorMessage.includes('User not found')) {
          toast.error('Please log in to send messages');
        } else if (errorMessage.includes('Unauthorized')) {
          toast.error('You can only access your own chats');
        } else {
          toast.error('Failed to send message');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [currentChatId, createNewChat, sendMessageMutation]
  );

  return {
    currentChatId,
    messages: messages || [],
    isLoading,
    sendMessage,
    createNewChat,
    setCurrentChatId,
  };
}
