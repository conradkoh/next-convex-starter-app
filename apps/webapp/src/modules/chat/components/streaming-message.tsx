'use client';

import { memo, useEffect, useState } from 'react';

/**
 * Props for the StreamingMessage component
 */
interface StreamingMessageProps {
  /** The current content of the streaming message */
  content: string;
  /** Unix timestamp when the message was created */
  timestamp: number;
}

/**
 * StreamingMessage component displays a message that is currently being streamed.
 * Features animated typing dots to indicate active streaming and a "Streaming..." indicator.
 * Memoized to prevent unnecessary re-renders when props haven't changed.
 *
 * @param props - The component props
 * @returns JSX element representing a streaming message
 */
export const StreamingMessage = memo<StreamingMessageProps>(function StreamingMessage({
  content,
  timestamp,
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

  return (
    <div className="w-full">
      <div className="w-full rounded-lg px-4 py-3">
        <div className="text-sm">
          {content}
          <span className="inline-flex items-center ml-1">
            <span className="w-4 text-muted-foreground">{dots}</span>
          </span>
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          {new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
          <span className="ml-2 text-blue-500">Streaming...</span>
        </div>
      </div>
    </div>
  );
});
