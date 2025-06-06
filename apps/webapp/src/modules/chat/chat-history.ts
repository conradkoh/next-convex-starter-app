import { api } from '@workspace/backend/convex/_generated/api';
import type { Id } from '@workspace/backend/convex/_generated/dataModel';
import { useSessionMutation, useSessionQuery } from 'convex-helpers/react/sessions';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export interface ChatHistoryItem {
  _id: Id<'chats'>;
  createdAt: number;
  updatedAt: number;
  userId: Id<'users'>;
  summary: string;
  messageCount: number;
}

export function useChatHistory() {
  const [cursor, setCursor] = useState<string | null>(null);
  const [allChats, setAllChats] = useState<ChatHistoryItem[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Get the current page of chat history
  const currentPageResult = useSessionQuery(api.chat.getChatHistory, {
    paginationOpts: {
      numItems: 20,
      cursor,
    },
  });

  // Mutation for deleting chats
  const softDeleteChatMutation = useSessionMutation(api.chat.softDeleteChat);

  // Extract data from result, handling errors
  const currentPage = currentPageResult?.success ? currentPageResult.data : null;
  const isLoading = currentPageResult === undefined;

  // Handle authentication errors
  useEffect(() => {
    if (currentPageResult && !currentPageResult.success) {
      if (
        currentPageResult.error === 'session_not_found' ||
        currentPageResult.error === 'user_not_found'
      ) {
        // Don't show error toast for auth issues - the UI will handle this
        console.log('Authentication required for chat history');
      } else {
        toast.error('Failed to load chat history');
      }
    }
  }, [currentPageResult]);

  // Update accumulated chats when new page data arrives
  useEffect(() => {
    if (currentPage) {
      if (cursor === null) {
        // First page - replace all chats
        setAllChats(
          currentPage.page.map((chat) => ({
            ...chat,
            _id: chat._id as Id<'chats'>,
            userId: chat.userId as Id<'users'>,
          }))
        );
      } else {
        // Subsequent pages - append to existing chats
        setAllChats((prev) => [
          ...prev,
          ...currentPage.page.map((chat) => ({
            ...chat,
            _id: chat._id as Id<'chats'>,
            userId: chat.userId as Id<'users'>,
          })),
        ]);
      }

      setHasMore(!currentPage.isDone);
      setIsLoadingMore(false);
    }
  }, [currentPage, cursor]);

  const loadMoreChats = useCallback(() => {
    if (hasMore && !isLoadingMore && currentPage?.continueCursor) {
      setIsLoadingMore(true);
      setCursor(currentPage.continueCursor);
    }
  }, [hasMore, isLoadingMore, currentPage?.continueCursor]);

  const deleteChat = useCallback(
    async (chatId: string) => {
      try {
        await softDeleteChatMutation({ chatId: chatId as Id<'chats'> });
        // Remove the deleted chat from local state
        setAllChats((prev) => prev.filter((chat) => chat._id !== chatId));
        toast.success('Chat deleted successfully');
      } catch (error) {
        console.error('Failed to delete chat:', error);
        toast.error('Failed to delete chat');
      }
    },
    [softDeleteChatMutation]
  );

  // Reset state when starting fresh (e.g., after auth changes)
  const resetChatHistory = useCallback(() => {
    setCursor(null);
    setAllChats([]);
    setIsLoadingMore(false);
    setHasMore(true);
  }, []);

  // Check if we have authentication errors
  const hasAuthError =
    currentPageResult &&
    !currentPageResult.success &&
    (currentPageResult.error === 'session_not_found' ||
      currentPageResult.error === 'user_not_found');

  return {
    chats: allChats,
    isLoading,
    loadMoreChats,
    hasMore,
    isLoadingMore,
    hasAuthError: Boolean(hasAuthError),
    deleteChat,
    resetChatHistory,
  };
}
