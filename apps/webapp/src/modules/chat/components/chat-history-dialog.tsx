import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { useChatHistory } from '../chat-history';
import { ChatHistoryItemComponent } from './chat-history-item';

interface ChatHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectChat: (chatId: string) => void;
  currentChatId?: string;
}

export function ChatHistoryDialog({
  open,
  onOpenChange,
  onSelectChat,
  currentChatId,
}: ChatHistoryDialogProps) {
  const { chats, isLoading, loadMoreChats, hasMore, isLoadingMore } = useChatHistory();

  const handleSelectChat = (chatId: string) => {
    onSelectChat(chatId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chat History</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : chats.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <div className="text-center">
                <p className="text-sm">No chat history yet</p>
                <p className="text-xs mt-1">Start a conversation to see it here!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {chats.map((chat) => (
                <ChatHistoryItemComponent
                  key={chat._id}
                  chat={chat}
                  onSelect={handleSelectChat}
                  isSelected={chat._id === currentChatId}
                />
              ))}

              {hasMore && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => loadMoreChats()}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
