'use client';

import { useChat } from '@/modules/chat/chat';
import { ChatPanel } from '@/modules/chat/components/chat-panel';
import type { Id } from '@workspace/backend/convex/_generated/dataModel';

export default function AgentTestPage() {
  const { messages, isLoading, sendMessage, currentChatId, setCurrentChatId, createNewChat } =
    useChat();

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId as Id<'chats'>);
  };

  return (
    <div className="flex h-full">
      {/* Main content area */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Agent Test Page</h1>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              This is the main content area. The chat panel is on the right side.
            </p>
            <div className="bg-muted/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2">Test Content</h2>
              <p>
                You can interact with the AI chat on the right. Try sending a message to see the
                auto-response feature in action. Click the history icon to view and switch between
                previous chats.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat panel */}
      <div className="w-96 border-l">
        <ChatPanel
          messages={messages}
          onSendMessage={sendMessage}
          isLoading={isLoading}
          className="h-full border-0 rounded-none"
          currentChatId={currentChatId || undefined}
          onSelectChat={handleSelectChat}
          onCreateNewChat={createNewChat}
        />
      </div>
    </div>
  );
}
