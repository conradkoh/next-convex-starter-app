'use client';

import { Chat } from '@/modules/chat';

export default function AgentTestPage() {
  const handleChatChange = (chatId: string | null) => {
    console.log('Chat changed to:', chatId);
  };

  const handleNewChatCreated = (chatId: string) => {
    console.log('New chat created:', chatId);
  };

  return (
    <div className="flex h-screen">
      {/* Main content area */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Agent Test Page</h1>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              This is the main content area. The chat panel is on the right side.
            </p>
            <div className="bg-muted/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2">Streaming Chat Test</h2>
              <p className="mb-4">
                You can interact with the AI chat on the right. An OpenRouter API key is required
                for AI responses.
              </p>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Features:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Configure your OpenRouter API key via the settings button</li>
                  <li>Real-time streaming responses with live updates</li>
                  <li>Chat history with pagination</li>
                  <li>Create new chats with the plus button</li>
                  <li>Clear messaging when API key setup is required</li>
                  <li>Auto-scroll follows new messages when at bottom</li>
                  <li>Detached scroll mode when user scrolls up manually</li>
                  <li>Scroll-to-bottom button appears when detached</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat panel */}
      <div className="w-96 border-l flex flex-col overflow-hidden">
        <Chat
          className="flex-1 border-0 rounded-none overflow-hidden"
          onChatChange={handleChatChange}
          onNewChatCreated={handleNewChatCreated}
        />
      </div>
    </div>
  );
}
