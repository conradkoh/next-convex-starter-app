'use client';

import type { Id } from '@workspace/backend/convex/_generated/dataModel';
import { useCallback, useEffect, useMemo } from 'react';
import { useChat } from '../chat';
import { ChatPanel } from './chat-panel';

/**
 * Props for the Chat component
 */
interface ChatProps {
  /** Additional CSS classes to apply to the chat container */
  className?: string;
  /** Optional initial chat ID to load */
  initialChatId?: string;
  /** Optional callback function called when the current chat changes */
  onChatChange?: (chatId: string | null) => void;
  /** Optional callback function called when a new chat is created */
  onNewChatCreated?: (chatId: string) => void;
  /** Whether thinking mode is enabled */
  thinkingMode?: boolean;
  /** Callback for thinking mode toggle */
  onThinkingModeChange?: (enabled: boolean) => void;
}

/**
 * Chat component provides a complete chat interface with built-in state management.
 * This component encapsulates the useChat hook and ChatPanel, making it easy to add
 * chat functionality to any page with minimal setup.
 *
 * Features:
 * - Automatic chat state management via useChat hook
 * - Streaming message support with real-time updates
 * - Chat history and navigation
 * - Authentication and API key handling
 * - Auto-scrolling and loading states
 * - Responsive design with sidebar overlay
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Chat className="h-96" />
 *
 * // With callbacks
 * <Chat
 *   initialChatId="chat123"
 *   onChatChange={(chatId) => console.log('Chat changed:', chatId)}
 *   onNewChatCreated={(chatId) => console.log('New chat:', chatId)}
 * />
 * ```
 *
 * @param props - The component props
 * @returns JSX element representing the complete chat interface
 */
export function Chat({
  className = '',
  initialChatId,
  onChatChange,
  onNewChatCreated,
  thinkingMode,
  onThinkingModeChange,
}: ChatProps) {
  const {
    messages,
    isLoading,
    sendStreamingMessage,
    stopStreaming,
    isStreaming,
    currentChatId,
    setCurrentChatId,
    createNewChat,
    hasAuthError,
    hasApiKey,
    isMessagesLoading,
    selectedModel,
    setSelectedModel,
    availableModels,
    isModelDataReady,
  } = useChat();

  /**
   * Set initial chat ID if provided
   */
  useEffect(() => {
    if (initialChatId && !currentChatId) {
      setCurrentChatId(initialChatId as Id<'chats'>);
    }
  }, [initialChatId, currentChatId, setCurrentChatId]);

  /**
   * Handles chat selection with optional callback notification
   */
  const handleSelectChat = useCallback(
    (chatId: string) => {
      const typedChatId = chatId as Id<'chats'>;
      setCurrentChatId(typedChatId);
      onChatChange?.(chatId);
    },
    [setCurrentChatId, onChatChange]
  );

  /**
   * Handles new chat creation with optional callback notification
   */
  const handleCreateNewChat = useCallback(async () => {
    const newChatId = await createNewChat();
    if (newChatId) {
      onNewChatCreated?.(newChatId);
      onChatChange?.(newChatId);
    }
  }, [createNewChat, onNewChatCreated, onChatChange]);

  /**
   * Memoized current chat ID for ChatPanel prop
   */
  const chatPanelChatId = useMemo(() => {
    return currentChatId || undefined;
  }, [currentChatId]);

  /**
   * Memoized message sending handler
   */
  const handleSendMessage = useMemo(() => {
    return sendStreamingMessage;
  }, [sendStreamingMessage]);

  // Don't render until model data is ready
  if (!isModelDataReady) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <ChatPanel
      messages={messages}
      onSendMessage={handleSendMessage}
      onStopStreaming={stopStreaming}
      isLoading={isLoading}
      isStreaming={isStreaming}
      isMessagesLoading={isMessagesLoading}
      className={className}
      currentChatId={chatPanelChatId}
      onSelectChat={handleSelectChat}
      onCreateNewChat={handleCreateNewChat}
      hasAuthError={hasAuthError}
      hasApiKey={hasApiKey}
      selectedModel={selectedModel as string}
      onModelChange={setSelectedModel}
      availableModels={availableModels as NonNullable<typeof availableModels>}
      thinkingMode={thinkingMode}
      onThinkingModeChange={onThinkingModeChange}
    />
  );
}
