import { cn } from '@/lib/utils';

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
}

export function ChatMessage({ content, role, timestamp }: ChatMessageProps) {
  const isUser = role === 'user';

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
}
