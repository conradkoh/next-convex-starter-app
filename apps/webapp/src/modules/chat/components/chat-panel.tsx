import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAuthState } from '@/modules/auth/AuthProvider';
import type { Id } from '@workspace/backend/convex/_generated/dataModel';
import { ChevronDown, History, LogIn, Plus, Settings } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { useAutoScroll } from '../hooks/use-auto-scroll';
import { ApiKeyDialog } from './api-key-dialog';
import { ChatInput } from './chat-input';
import { ChatMessage } from './chat-message';
import { ChatSidebar } from './chat-sidebar';
import type { FileAttachment } from './file-upload';

/**
 * Message interface for chat messages
 */
interface Message {
  _id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  isStreaming?: boolean;
  modelUsed: string; // Required for all messages
  attachments?: Array<{
    storageId: Id<'_storage'>;
    metadata: {
      name: string;
      size: number;
      type: string;
      uploadedAt: number;
    };
  }>;
}

/**
 * Model interface matching the backend ChatModel type
 */
interface ChatModel {
  id: string;
  name: string;
  category: 'fast' | 'smart';
  provider: string;
  description?: string;
}

/**
 * Props for the ChatPanel component
 */
interface ChatPanelProps {
  /** Array of chat messages to display */
  messages: Message[];
  /** Callback function called when a message is sent */
  onSendMessage: (message: string, files?: FileAttachment[]) => void;
  /** Optional callback function called when streaming should be stopped */
  onStopStreaming?: () => void;
  /** Whether the chat is in a loading state */
  isLoading?: boolean;
  /** Whether a message is currently being streamed */
  isStreaming?: boolean;
  /** Whether messages are currently being loaded */
  isMessagesLoading?: boolean;
  /** Additional CSS classes to apply to the panel */
  className?: string;
  /** ID of the currently active chat */
  currentChatId?: string;
  /** Optional callback function called when a chat is selected */
  onSelectChat?: (chatId: string) => void;
  /** Optional callback function called when a new chat should be created */
  onCreateNewChat?: () => void;
  /** Whether there's an authentication error */
  hasAuthError?: boolean;
  /** Whether the user has configured an API key */
  hasApiKey?: boolean;
  /** Currently selected model ID (required) */
  selectedModel: string;
  /** Callback function called when model selection changes (required) */
  onModelChange: (modelId: string) => void;
  /** Available models organized by category (required) */
  availableModels: {
    defaultModels: ChatModel[];
    defaultCategories: { [K in 'fast' | 'smart']: ChatModel[] };
    extendedModels: ChatModel[];
    extendedCategories: { [K in 'fast' | 'smart']: ChatModel[] };
    defaultModelId: string;
  };
  /** Whether thinking mode is enabled */
  thinkingMode?: boolean;
  /** Callback for thinking mode toggle */
  onThinkingModeChange?: (enabled: boolean) => void;
}

/**
 * ChatPanel component provides the main chat interface with messages, input, and controls.
 * Features include authentication handling, API key management, chat history, auto-scrolling,
 * loading states, and responsive design.
 *
 * @param props - The component props
 * @returns JSX element representing the complete chat panel interface
 */
export function ChatPanel({
  messages,
  onSendMessage,
  onStopStreaming,
  isLoading = false,
  isStreaming = false,
  isMessagesLoading = false,
  className = '',
  currentChatId,
  onSelectChat,
  onCreateNewChat,
  hasAuthError = false,
  hasApiKey = false,
  selectedModel,
  onModelChange,
  availableModels,
  thinkingMode,
  onThinkingModeChange,
}: ChatPanelProps) {
  const [showSidebar, setShowSidebar] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const authState = useAuthState();

  // Auto-scroll hook - depends on messages and streaming state
  const { scrollRef, isDetached, handleScroll, scrollToBottom } = useAutoScroll({
    threshold: 100,
    dependencies: [messages, messages.find((m) => m.isStreaming)?.content],
  });

  const handleSelectChat = useCallback(
    (chatId: string) => {
      if (onSelectChat) {
        onSelectChat(chatId);
      }
      setShowSidebar(false); // Close sidebar after selecting a chat
    },
    [onSelectChat]
  );

  const handleCreateNewChat = useCallback(() => {
    if (onCreateNewChat) {
      onCreateNewChat();
    }
    setShowSidebar(false); // Close sidebar after creating new chat
  }, [onCreateNewChat]);

  const handleShowSidebar = useCallback(() => {
    setShowSidebar(true);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setShowSidebar(false);
  }, []);

  const handleShowApiKeyDialog = useCallback(() => {
    setShowApiKeyDialog(true);
  }, []);

  const handleCloseApiKeyDialog = useCallback((open: boolean) => {
    setShowApiKeyDialog(open);
  }, []);

  const handleBackdropClick = useCallback(() => {
    setShowSidebar(false);
  }, []);

  const handleBackdropKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSidebar(false);
    }
  }, []);

  // Check if user is authenticated
  const isAuthenticated = authState?.state === 'authenticated';
  const isAuthLoading = authState === undefined;

  // Show auth error if we have explicit auth errors from queries or user is not authenticated
  const showAuthError = hasAuthError || (!isAuthLoading && !isAuthenticated);

  // Determine if we should show loading skeleton
  // Show skeleton when we have a chat ID and messages query is actually loading (undefined)
  // Don't show skeleton for empty chats (messages is empty array [])
  const showSkeleton = isMessagesLoading && !isLoading && !showAuthError;

  return (
    <div className={`flex h-full ${className} relative`}>
      {/* Main chat area */}
      <div className="flex flex-col flex-1 border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
          <h3 className="font-semibold">AI Chat</h3>

          {isAuthenticated && !hasAuthError && (
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
                onClick={handleShowSidebar}
                className="h-8 w-8 p-0"
                title="Chat History"
              >
                <History className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShowApiKeyDialog}
                className="h-8 w-8 p-0"
                title="Settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Messages Container */}
        <div className="flex-1 relative overflow-hidden">
          {/* Scrollable Messages Area */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="absolute inset-0 overflow-y-auto p-4 scroll-smooth"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'hsl(var(--border)) transparent',
            }}
          >
            {isAuthLoading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <p className="text-sm">Loading...</p>
                </div>
              </div>
            ) : showAuthError ? (
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
            ) : !hasApiKey ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center space-y-4">
                  <Settings className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <div>
                    <p className="text-sm font-medium">API Key Required</p>
                    <p className="text-xs mt-1">
                      Configure your OpenRouter API key to start chatting with AI
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleShowApiKeyDialog}>
                    Configure API Key
                  </Button>
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
                    isStreaming={message.isStreaming}
                    modelUsed={message.modelUsed}
                    attachments={message.attachments}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Scroll to Bottom Button */}
          {isDetached && (
            <div className="absolute bottom-4 right-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={scrollToBottom}
                className={cn(
                  'h-8 w-8 p-0 rounded-full shadow-lg',
                  'bg-background/80 backdrop-blur-sm border',
                  'hover:bg-background/90 transition-all duration-200'
                )}
                title="Scroll to bottom"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Input */}
        {isAuthenticated && !hasAuthError && hasApiKey && (
          <div className="flex-shrink-0">
            <ChatInput
              onSendMessage={onSendMessage}
              onStopStreaming={onStopStreaming}
              disabled={isLoading}
              isStreaming={isStreaming}
              placeholder={
                isStreaming ? 'AI is responding...' : isLoading ? 'Sending...' : 'Type a message...'
              }
              selectedModel={selectedModel}
              availableModels={availableModels}
              onModelChange={onModelChange}
              thinkingMode={thinkingMode}
              onThinkingModeChange={onThinkingModeChange}
            />
          </div>
        )}

        {/* API Key Dialog */}
        {isAuthenticated && !hasAuthError && (
          <ApiKeyDialog open={showApiKeyDialog} onOpenChange={handleCloseApiKeyDialog} />
        )}
      </div>

      {/* Sidebar Overlay */}
      {showSidebar && (
        <div className="absolute inset-0 z-50 flex justify-center p-4">
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-black/20 cursor-default"
            onClick={handleBackdropClick}
            onKeyDown={handleBackdropKeyDown}
            aria-label="Close sidebar"
          />

          {/* Sidebar Panel */}
          <div className="relative w-96 h-[600px] max-h-[80vh] bg-background border rounded-lg shadow-2xl">
            <ChatSidebar
              isOpen={showSidebar}
              onClose={handleCloseSidebar}
              currentChatId={currentChatId}
              onSelectChat={handleSelectChat}
              onCreateNewChat={handleCreateNewChat}
              className="h-full rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
