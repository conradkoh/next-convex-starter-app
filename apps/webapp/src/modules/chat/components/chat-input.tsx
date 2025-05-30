import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Square } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Props for the ChatInput component
 */
interface ChatInputProps {
  /** Callback function called when a message is sent */
  onSendMessage: (message: string) => void;
  /** Optional callback function called when streaming should be stopped */
  onStopStreaming?: () => void;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether a message is currently being streamed */
  isStreaming?: boolean;
  /** Placeholder text for the input field */
  placeholder?: string;
}

/**
 * ChatInput component provides a text input area for sending messages in a chat interface.
 * Features auto-resizing textarea, keyboard shortcuts, and streaming controls.
 *
 * @param props - The component props
 * @returns JSX element representing the chat input interface
 */
export function ChatInput({
  onSendMessage,
  onStopStreaming,
  disabled = false,
  isStreaming = false,
  placeholder = 'Type a message...',
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea function
  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [resizeTextarea]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (message.trim() && !disabled && !isStreaming) {
        onSendMessage(message.trim());
        setMessage('');
      }
    },
    [message, disabled, isStreaming, onSendMessage]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMessage(e.target.value);
      // Trigger resize on next tick
      setTimeout(resizeTextarea, 0);
    },
    [resizeTextarea]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit]
  );

  const handleStopClick = useCallback(() => {
    if (onStopStreaming && isStreaming) {
      onStopStreaming();
    }
  }, [onStopStreaming, isStreaming]);

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t">
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 min-h-[40px] max-h-[120px] resize-none"
        rows={1}
      />
      {isStreaming ? (
        <Button
          type="button"
          onClick={handleStopClick}
          disabled={!onStopStreaming}
          size="icon"
          variant="destructive"
        >
          <Square className="h-4 w-4" />
        </Button>
      ) : (
        <Button type="submit" disabled={disabled || !message.trim()} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      )}
    </form>
  );
}
