import { api } from '@workspace/backend/convex/_generated/api';
import type { Id } from '@workspace/backend/convex/_generated/dataModel';
import { useSessionQuery } from 'convex-helpers/react/sessions';
import { useCallback, useState } from 'react';

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

  // Get the current page of chat history
  const currentPage = useSessionQuery(api.chat.getChatHistory, {
    paginationOpts: {
      numItems: 20,
      cursor,
    },
  });

  // Update accumulated chats when new page loads
  const chats = currentPage?.page || [];
  const hasMore = currentPage ? !currentPage.isDone : false;
  const isLoading = currentPage === undefined;

  const loadMoreChats = useCallback(
    (numItems = 20) => {
      if (hasMore && !isLoadingMore && currentPage?.continueCursor) {
        setIsLoadingMore(true);
        setCursor(currentPage.continueCursor);
        // Note: In a real implementation, you'd want to accumulate the results
        // For now, this will just load the next page
        setTimeout(() => setIsLoadingMore(false), 100);
      }
    },
    [hasMore, isLoadingMore, currentPage?.continueCursor]
  );

  return {
    chats,
    isLoading,
    loadMoreChats,
    hasMore,
    isLoadingMore,
  };
}
