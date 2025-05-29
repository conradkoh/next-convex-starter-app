import { Button } from '@/components/ui/button';
import type { ChatHistoryItem } from '../chat-history';

interface ChatHistoryItemComponentProps {
  chat: ChatHistoryItem;
  onSelect: (chatId: string) => void;
  isSelected?: boolean;
}

export function ChatHistoryItemComponent({
  chat,
  onSelect,
  isSelected = false,
}: ChatHistoryItemComponentProps) {
  const handleClick = () => {
    onSelect(chat._id);
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <Button
      variant={isSelected ? 'secondary' : 'ghost'}
      className="w-full justify-start h-auto p-3 text-left"
      onClick={handleClick}
    >
      <div className="flex flex-col gap-1 w-full">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm truncate flex-1">{chat.summary}</span>
          <span className="text-xs text-muted-foreground ml-2">{chat.messageCount}</span>
        </div>
        <div className="text-xs text-muted-foreground">{formatTimeAgo(chat.updatedAt)}</div>
      </div>
    </Button>
  );
}
