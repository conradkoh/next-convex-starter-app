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
- **Compact Model Selection**: Choose from different AI models with a modern, space-efficient selector
- **Chat History**: Browse and switch between previous conversations
- **Authentication**: Automatic anonymous login and auth error handling
- **API Key Management**: Built-in OpenRouter API key configuration
- **Auto-scrolling**: Smart scrolling that follows new messages
- **Responsive Design**: Works on desktop and mobile
- **Loading States**: Proper loading indicators and skeleton screens

## Model Selection

The chat interface includes an enhanced model selector positioned in its own row below the input area for easy access:

### Design Features

- **Dedicated Row**: Model selector has its own row below the input for better organization
- **Curated Default Models**: Streamlined list of 6 carefully selected models for most users
- **Custom Model Input**: Advanced users can add any model using provider/model-name format
- **Clear Labeling**: "Model:" label for better user understanding
- **Modern Styling**: Clean, minimal design with proper borders and spacing

### Available Models

**Default Fast Models** (optimized for speed):
- Gemini 2.5 Flash
- Gemini 2.5 Flash (Thinking)
- GPT-4o Mini

**Default Smart Models** (optimized for complex reasoning):
- GPT-4o
- Claude Sonnet 4
- GPT-4.1

### Custom Models

Users can add custom models by:
1. Selecting "Add Custom Model" from the dropdown
2. Entering the model ID in `provider/model-name` format (e.g., `anthropic/claude-3.5-sonnet`)
3. The system automatically tracks usage and provides search functionality

**Extended Models Available for Custom Selection**:
- All default models plus additional options like:
  - Gemini Flash 1.5, Gemini 2.0 Flash, Gemini 2.5 Pro Preview
  - Claude 3.5 Sonnet, GPT-4 Turbo
  - Llama 3.1 405B, Mistral Large
  - Any valid OpenRouter model ID

### Model Persistence

- Model selection persists per chat conversation
- New chats inherit the last selected model
- Custom models are saved per user with usage tracking
- Model used for each message is displayed as a subtle badge on assistant responses

### Programmatic Access

```tsx
import { useChat } from '@/modules/chat';

function MyComponent() {
  const {
    selectedModel,
    setSelectedModel,
    availableModels,
  } = useChat();

  // Change model programmatically
  const switchToFastModel = () => {
    setSelectedModel('google/gemini-2.5-flash-preview-05-20');
  };

  return (
    <div>
      <p>Current model: {selectedModel}</p>
      <button onClick={switchToFastModel}>Switch to Fast Model</button>
    </div>
  );
}
```

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