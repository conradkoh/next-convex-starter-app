import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { MoreVertical, Trash2 } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import type { ChatHistoryItem } from '../chat-history';

/**
 * Props for the ChatHistoryItemComponent
 */
interface ChatHistoryItemComponentProps {
  /** The chat history item data to display */
  chat: ChatHistoryItem;
  /** Callback function called when the chat item is selected */
  onSelect: (chatId: string) => void;
  /** Optional callback function called when the chat is deleted */
  onDelete?: (chatId: string) => Promise<void>;
  /** Whether this chat item is currently selected */
  isSelected?: boolean;
}

/**
 * ChatHistoryItemComponent displays a single chat history item with selection and deletion capabilities.
 * Features include hover states, keyboard navigation, and a confirmation dialog for deletion.
 * Memoized to prevent unnecessary re-renders when props haven't changed.
 *
 * @param props - The component props
 * @returns JSX element representing a chat history item
 */
export const ChatHistoryItemComponent = memo<ChatHistoryItemComponentProps>(
  function ChatHistoryItemComponent({ chat, onSelect, onDelete, isSelected = false }) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleClick = useCallback(() => {
      onSelect(chat._id);
    }, [onSelect, chat._id]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(chat._id);
        }
      },
      [onSelect, chat._id]
    );

    const handleDeleteClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      setShowDeleteConfirm(true);
    }, []);

    const confirmDelete = useCallback(async () => {
      if (!onDelete) return;

      setIsDeleting(true);
      try {
        await onDelete(chat._id);
        setShowDeleteConfirm(false);
      } catch (error) {
        console.error('Failed to delete chat:', error);
        // Keep the dialog open so user can try again
        // Parent component should handle showing error toast
      } finally {
        setIsDeleting(false);
      }
    }, [onDelete, chat._id]);

    const handleCancelDelete = useCallback(() => {
      setShowDeleteConfirm(false);
    }, []);

    const formatTimeAgo = useCallback((timestamp: number) => {
      const now = Date.now();
      const diff = now - timestamp;
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days > 0) return `${days}d ago`;
      if (hours > 0) return `${hours}h ago`;
      if (minutes > 0) return `${minutes}m ago`;
      return 'Just now';
    }, []);

    return (
      <>
        <div className="relative group">
          <button
            type="button"
            className={cn(
              'flex items-center w-full px-3 py-2.5 text-left rounded-lg hover:bg-muted/50 cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring group',
              isSelected && 'bg-muted border border-border/50'
            )}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            aria-label={`Select chat: ${chat.summary}`}
          >
            <div className="flex flex-col gap-1.5 w-full min-w-0 pr-8">
              {/* Chat title */}
              <div className="flex items-center">
                <h4 className="font-medium text-sm truncate text-foreground leading-tight">
                  {chat.summary}
                </h4>
              </div>

              {/* Metadata row */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
                <span className="font-medium">{formatTimeAgo(chat.updatedAt)}</span>
                <span className="text-muted-foreground/40">•</span>
                <span className="font-medium">
                  {chat.messageCount} {chat.messageCount === 1 ? 'msg' : 'msgs'}
                </span>
              </div>
            </div>
          </button>

          {/* Action menu - positioned absolutely */}
          {onDelete && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-muted-foreground/10',
                      isSelected && 'opacity-100'
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-3 w-3" />
                    <span className="sr-only">Chat options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  <DropdownMenuItem
                    onClick={handleDeleteClick}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Delete confirmation dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm} modal>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Chat</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this chat? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={handleCancelDelete}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }
);
