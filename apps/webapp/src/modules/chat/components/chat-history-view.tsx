import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { useCallback } from 'react';
import { useChatHistory } from '../chat-history';
import { ChatHistoryItemComponent } from './chat-history-item';

/**
 * Props for the ChatHistoryView component
 */
interface ChatHistoryViewProps {
  /** ID of the currently active chat */
  currentChatId?: string;
  /** Optional callback function called when a chat is selected */
  onSelectChat?: (chatId: string) => void;
  /** Optional callback function called when a new chat should be created */
  onCreateNewChat?: () => void;
}

/**
 * ChatHistoryView component displays a scrollable list of chat history items.
 * Features include loading states, empty states, pagination, and chat deletion.
 * Automatically creates a new chat when the currently active chat is deleted.
 *
 * @param props - The component props
 * @returns JSX element representing the chat history view
 */
export function ChatHistoryView({
  currentChatId,
  onSelectChat,
  onCreateNewChat,
}: ChatHistoryViewProps) {
  const { chats, isLoading, loadMoreChats, hasMore, isLoadingMore, deleteChat } = useChatHistory();

  const handleSelectChat = useCallback(
    (chatId: string) => {
      if (onSelectChat) {
        onSelectChat(chatId);
      }
    },
    [onSelectChat]
  );

  const handleDeleteChat = useCallback(
    async (chatId: string) => {
      // Check if we're deleting the currently active chat
      const isDeletingCurrentChat = chatId === currentChatId;

      await deleteChat(chatId);

      // If we deleted the currently active chat, create a new one
      if (isDeletingCurrentChat && onCreateNewChat) {
        onCreateNewChat();
      }
    },
    [currentChatId, deleteChat, onCreateNewChat]
  );

  const handleLoadMore = useCallback(() => {
    loadMoreChats();
  }, [loadMoreChats]);

  return (
    <div className="flex flex-col h-full bg-background min-h-0">
      {/* Content area with proper height constraints */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-3">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : chats.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium">No chat history yet</p>
                  <p className="text-xs text-muted-foreground/70">
                    Start a conversation to see it here!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {chats.map((chat) => (
                  <ChatHistoryItemComponent
                    key={chat._id}
                    chat={chat}
                    onSelect={handleSelectChat}
                    onDelete={handleDeleteChat}
                    isSelected={chat._id === currentChatId}
                  />
                ))}

                {hasMore && (
                  <div className="pt-3 px-1">
                    <Button
                      variant="outline"
                      className="w-full h-9 text-xs font-medium border-dashed hover:border-solid transition-all duration-200"
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin mr-2" />
                          Loading...
                        </>
                      ) : (
                        'Load More Chats'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
