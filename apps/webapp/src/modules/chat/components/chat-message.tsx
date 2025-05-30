import { cn } from '@/lib/utils';
import { memo } from 'react';
import { StreamingMessage } from './streaming-message';

/**
 * Props for the ChatMessage component
 */
interface ChatMessageProps {
  /** The text content of the message */
  content: string;
  /** The role of the message sender - either 'user' or 'assistant' */
  role: 'user' | 'assistant';
  /** Unix timestamp when the message was created */
  timestamp: number;
  /** Whether the message is currently being streamed (for assistant messages) */
  isStreaming?: boolean;
}

/**
 * ChatMessage component displays a single message in the chat interface.
 * Handles both user and assistant messages with appropriate styling.
 * For streaming assistant messages, delegates to the StreamingMessage component.
 * Memoized to prevent unnecessary re-renders when props haven't changed.
 *
 * @param props - The component props
 * @returns JSX element representing a chat message
 */
export const ChatMessage = memo<ChatMessageProps>(function ChatMessage({
  content,
  role,
  timestamp,
  isStreaming = false,
}) {
  const isUser = role === 'user';

  // Use streaming component for streaming assistant messages
  if (isStreaming && role === 'assistant') {
    return <StreamingMessage content={content} timestamp={timestamp} />;
  }

  return (
    <div className="w-full mb-4">
      <div
        className={cn(
          'w-full rounded-lg px-4 py-3 text-sm',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-transparent text-foreground'
        )}
      >
        <div className="whitespace-pre-wrap">{content}</div>
        <div className={cn('text-xs mt-2 opacity-70')}>
          {new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
});
