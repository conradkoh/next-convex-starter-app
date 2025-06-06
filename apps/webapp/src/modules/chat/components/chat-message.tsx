import { Badge } from '@/components/ui/badge';
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
  /** The AI model used to generate this message (required for assistant messages) */
  modelUsed: string;
  /** Optional file attachments metadata */
  attachments?: Array<{
    metadata: {
      name: string;
      size: number;
      type: string;
    };
  }>;
}

/**
 * ChatMessage component displays a single message in the chat interface.
 * Handles both user and assistant messages with appropriate styling.
 * For streaming assistant messages, delegates to the StreamingMessage component.
 * Shows model indicator for assistant messages when modelUsed is provided.
 * Shows file names when attachments are present (files are sent directly to AI, not stored).
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
  modelUsed,
  attachments,
}) {
  const isUser = role === 'user';

  // Use streaming component for streaming assistant messages
  if (isStreaming && role === 'assistant') {
    return <StreamingMessage content={content} timestamp={timestamp} modelUsed={modelUsed} />;
  }

  // Helper function to get abbreviated model display name
  const getModelDisplayName = (modelId: string) => {
    // Extract and format model name for compact display
    const parts = modelId.split('/');
    const modelPart = parts[parts.length - 1];

    // Handle specific model patterns
    if (modelPart.includes('gemini')) {
      if (modelPart.includes('flash')) {
        if (modelPart.includes('2.5')) return 'Gemini 2.5 Flash';
        if (modelPart.includes('2.0')) return 'Gemini 2.0 Flash';
        return 'Gemini Flash';
      }
      if (modelPart.includes('pro')) return 'Gemini Pro';
      return 'Gemini';
    }

    if (modelPart.includes('gpt-4o')) {
      if (modelPart.includes('mini')) return 'GPT-4o Mini';
      return 'GPT-4o';
    }

    if (modelPart.includes('gpt-4')) return 'GPT-4.1';
    if (modelPart.includes('claude')) return 'Claude Sonnet';

    // Fallback to formatted version
    return modelPart
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .substring(0, 20);
  };

  const modelDisplayName = !isUser ? getModelDisplayName(modelUsed) : null;

  return (
    <div className="w-full mb-4">
      <div
        className={cn(
          'w-full rounded-lg px-4 py-3 text-sm',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-transparent text-foreground'
        )}
      >
        {/* File Attachments Metadata */}
        {attachments && attachments.length > 0 && (
          <div className="mb-3">
            <div className="text-xs opacity-70 mb-1">Attached files ({attachments.length}):</div>
            <div className="text-xs opacity-80">
              {attachments.map((attachment, index) => (
                <span key={attachment.metadata.name}>
                  {attachment.metadata.name}
                  {index < attachments.length - 1 && ', '}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Text Content */}
        <div className="whitespace-pre-wrap">{content}</div>

        {/* Footer with timestamp and model info */}
        <div className={cn('flex items-center justify-between mt-2')}>
          <div className={cn('text-xs opacity-70')}>
            {new Date(timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          {/* Model indicator for assistant messages */}
          {!isUser && modelDisplayName && (
            <Badge
              variant="outline"
              className="text-xs h-5 px-2 py-0 text-muted-foreground border-muted-foreground/20"
            >
              {modelDisplayName}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
});
