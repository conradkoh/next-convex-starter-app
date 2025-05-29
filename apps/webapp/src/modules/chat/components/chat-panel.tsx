import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthState } from '@/modules/auth/AuthProvider';
import { History, LogIn, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { ChatHistoryDialog } from './chat-history-dialog';
import { ChatInput } from './chat-input';
import { ChatMessage } from './chat-message';

interface Message {
  _id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
}

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  className?: string;
  currentChatId?: string;
  onSelectChat?: (chatId: string) => void;
  onCreateNewChat?: () => void;
}

export function ChatPanel({
  messages,
  onSendMessage,
  isLoading = false,
  className = '',
  currentChatId,
  onSelectChat,
  onCreateNewChat,
}: ChatPanelProps) {
  const [showHistory, setShowHistory] = useState(false);
  const authState = useAuthState();

  const handleSelectChat = (chatId: string) => {
    if (onSelectChat) {
      onSelectChat(chatId);
    }
  };

  const handleCreateNewChat = () => {
    if (onCreateNewChat) {
      onCreateNewChat();
    }
  };

  // Check if user is authenticated
  const isAuthenticated = authState?.state === 'authenticated';
  const isAuthLoading = authState === undefined;

  // Determine if we should show loading skeleton
  // Show skeleton when we have a chat ID but messages haven't loaded yet
  const showSkeleton = currentChatId && messages.length === 0 && !isLoading;

  return (
    <div className={`flex flex-col h-full border rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">AI Chat</h3>
        {isAuthenticated && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreateNewChat}
              disabled={isLoading}
              className="h-8 w-8 p-0"
              title="New Chat"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(true)}
              className="h-8 w-8 p-0"
              title="Chat History"
            >
              <History className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {isAuthLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">Loading...</p>
            </div>
          </div>
        ) : !isAuthenticated ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center space-y-4">
              <LogIn className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <div>
                <p className="text-sm font-medium">Login Required</p>
                <p className="text-xs mt-1">Please log in to use the chat feature</p>
              </div>
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Go to Login
                </Button>
              </Link>
            </div>
          </div>
        ) : showSkeleton ? (
          <div className="space-y-4">
            {/* Skeleton for user message */}
            <div className="w-full">
              <div className="w-full rounded-lg px-4 py-3 bg-primary/10">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-16 mt-2" />
              </div>
            </div>
            {/* Skeleton for assistant message */}
            <div className="w-full">
              <div className="w-full rounded-lg px-4 py-3">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6 mb-2" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-16 mt-2" />
              </div>
            </div>
            {/* Skeleton for another user message */}
            <div className="w-full">
              <div className="w-full rounded-lg px-4 py-3 bg-primary/10">
                <Skeleton className="h-4 w-4/5 mb-2" />
                <Skeleton className="h-3 w-16 mt-2" />
              </div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Start a conversation!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message) => (
              <ChatMessage
                key={message._id}
                content={message.content}
                role={message.role}
                timestamp={message.timestamp}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      {isAuthenticated && (
        <ChatInput
          onSendMessage={onSendMessage}
          disabled={isLoading}
          placeholder={isLoading ? 'Sending...' : 'Type a message...'}
        />
      )}

      {/* Chat History Dialog */}
      {isAuthenticated && (
        <ChatHistoryDialog
          open={showHistory}
          onOpenChange={setShowHistory}
          onSelectChat={handleSelectChat}
          currentChatId={currentChatId}
        />
      )}
    </div>
  );
}
