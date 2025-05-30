import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Square } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ModelSelector } from './model-selector';

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
  /** Currently selected model ID (required) */
  selectedModel: string;
  /** Available models organized by category (required) */
  availableModels: {
    defaultModels: ChatModel[];
    defaultCategories: { [K in 'fast' | 'smart']: ChatModel[] };
    extendedModels: ChatModel[];
    extendedCategories: { [K in 'fast' | 'smart']: ChatModel[] };
    defaultModelId: string;
  };
  /** Callback function called when model selection changes (required) */
  onModelChange: (modelId: string) => void;
  /** Whether thinking mode is enabled */
  thinkingMode?: boolean;
  /** Callback for thinking mode toggle */
  onThinkingModeChange?: (enabled: boolean) => void;
}

/**
 * ChatInput component provides a text input area for sending messages in a chat interface.
 * Features auto-resizing textarea, keyboard shortcuts, streaming controls, and model selection.
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
  selectedModel,
  availableModels,
  onModelChange,
  thinkingMode = false,
  onThinkingModeChange,
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
    <div className="border-t">
      {/* Input Row */}
      <form onSubmit={handleSubmit} className="flex gap-2 p-4">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled && !isStreaming}
            className="min-h-[40px] max-h-[120px] resize-none pr-2"
            rows={1}
          />
        </div>

        {/* Send/Stop Button */}
        {isStreaming ? (
          <Button
            type="button"
            onClick={handleStopClick}
            disabled={!onStopStreaming}
            size="icon"
            variant="destructive"
            className="h-8 w-8"
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={disabled || !message.trim()}
            size="icon"
            className="h-8 w-8"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </form>

      {/* Model Selector Row */}
      <div className="px-4 pb-3 border-t border-border/50">
        <div className="flex items-center justify-start">
          <ModelSelector
            selectedModel={selectedModel}
            availableModels={availableModels}
            onModelChange={onModelChange}
            disabled={disabled || isStreaming}
            isLoading={false}
            thinkingMode={thinkingMode}
            onThinkingModeChange={onThinkingModeChange}
          />
        </div>
      </div>
    </div>
  );
}
