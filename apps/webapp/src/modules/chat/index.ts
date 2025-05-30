// Main chat hook and types
export { useChat, type ChatMessage as ChatMessageType, type Chat as ChatType } from './chat';
export { useChatHistory } from './chat-history';

// Main chat component (recommended for most use cases)
export { Chat } from './components/chat';

// Individual components (for advanced use cases)
export { ChatPanel } from './components/chat-panel';
export { ChatInput } from './components/chat-input';
export { ChatMessage } from './components/chat-message';
export { ChatSidebar } from './components/chat-sidebar';
export { ChatHistoryView } from './components/chat-history-view';
export { ApiKeyDialog } from './components/api-key-dialog';
export { ModelSelector } from './components/model-selector';

// Hooks
export { useAutoScroll } from './hooks/use-auto-scroll';
