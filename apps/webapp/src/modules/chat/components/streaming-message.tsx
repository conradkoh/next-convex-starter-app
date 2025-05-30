'use client';

import { Badge } from '@/components/ui/badge';
import { memo, useEffect, useState } from 'react';

/**
 * Props for the StreamingMessage component
 */
interface StreamingMessageProps {
  /** The current content of the streaming message */
  content: string;
  /** Unix timestamp when the message was created */
  timestamp: number;
  /** The AI model used to generate this message (required) */
  modelUsed: string;
}

/**
 * StreamingMessage component displays a message that is currently being streamed.
 * Features animated typing dots to indicate active streaming.
 * Memoized to prevent unnecessary re-renders when props haven't changed.
 *
 * @param props - The component props
 * @returns JSX element representing a streaming message
 */
export const StreamingMessage = memo<StreamingMessageProps>(function StreamingMessage({
  content,
  timestamp,
  modelUsed,
}) {
  const [dots, setDots] = useState('');

  // Animate typing dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === '...') return '';
        return `${prev}.`;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

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

  const modelDisplayName = getModelDisplayName(modelUsed);

  return (
    <div className="w-full mb-4">
      <div className="w-full rounded-lg px-4 py-3">
        <div className="text-sm">
          {content}
          <span className="inline-flex items-center ml-1">
            <span className="w-4 text-muted-foreground">{dots}</span>
          </span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="text-xs opacity-70">
            {new Date(timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          {/* Model indicator */}
          <Badge
            variant="outline"
            className="text-xs h-5 px-2 py-0 text-muted-foreground border-muted-foreground/20"
          >
            {modelDisplayName}
          </Badge>
        </div>
      </div>
    </div>
  );
});
