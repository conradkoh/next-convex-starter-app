# Chat Module

The Chat module provides a complete AI chat interface with streaming support, chat history, and authentication handling.

## Quick Start

The easiest way to add chat functionality to your app is using the `Chat` component:

```tsx
import { Chat } from '@/modules/chat';

export default function MyPage() {
  return (
    <div className="h-screen">
      <Chat className="h-full" />
    </div>
  );
}
```

## Chat Component

The `Chat` component is a high-level component that encapsulates all chat functionality:

### Basic Usage

```tsx
import { Chat } from '@/modules/chat';

function ChatPage() {
  return <Chat className="h-96 border rounded-lg" />;
}
```

### With Callbacks

```tsx
import { Chat } from '@/modules/chat';

function ChatPage() {
  const handleChatChange = (chatId: string | null) => {
    console.log('Active chat changed:', chatId);
  };

  const handleNewChatCreated = (chatId: string) => {
    console.log('New chat created:', chatId);
    // You could navigate to a new URL, update state, etc.
  };

  return (
    <Chat
      className="h-96"
      onChatChange={handleChatChange}
      onNewChatCreated={handleNewChatCreated}
    />
  );
}
```

### With Initial Chat

```tsx
import { Chat } from '@/modules/chat';

function ChatPage({ chatId }: { chatId: string }) {
  return (
    <Chat
      className="h-96"
      initialChatId={chatId}
      onChatChange={(id) => {
        // Update URL or state when chat changes
        window.history.pushState({}, '', `/chat/${id}`);
      }}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `initialChatId` | `string` | `undefined` | Initial chat ID to load |
| `onChatChange` | `(chatId: string \| null) => void` | `undefined` | Called when active chat changes |
| `onNewChatCreated` | `(chatId: string) => void` | `undefined` | Called when new chat is created |

## Features

- **Streaming Chat**: Real-time AI responses with live updates
- **Chat History**: Browse and switch between previous conversations
- **Authentication**: Automatic anonymous login and auth error handling
- **API Key Management**: Built-in OpenRouter API key configuration
- **Auto-scrolling**: Smart scrolling that follows new messages
- **Responsive Design**: Works on desktop and mobile
- **Loading States**: Proper loading indicators and skeleton screens

## Advanced Usage

For more control, you can use the individual components:

```tsx
import { useChat, ChatPanel } from '@/modules/chat';

function CustomChatPage() {
  const {
    messages,
    sendStreamingMessage,
    isLoading,
    // ... other chat state
  } = useChat();

  return (
    <ChatPanel
      messages={messages}
      onSendMessage={sendStreamingMessage}
      isLoading={isLoading}
      // ... other props
    />
  );
}
```

## Requirements

1. **Authentication**: Users need to be authenticated (automatic anonymous login is handled)
2. **API Key**: Users need to configure an OpenRouter API key
3. **Environment**: `NEXT_PUBLIC_CONVEX_SITE_URL` must be set for streaming

## Error Handling

The component handles common errors automatically:

- **Authentication errors**: Shows login prompt
- **Missing API key**: Shows configuration dialog
- **Network errors**: Shows error messages via toast
- **Chat not found**: Handles gracefully with error message

## Styling

The component uses Tailwind CSS and follows the design system. You can customize appearance with:

- `className` prop for container styling
- CSS custom properties for theming
- ShadCN component overrides 