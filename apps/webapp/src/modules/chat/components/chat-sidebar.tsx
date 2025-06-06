import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { History, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { ChatHistoryView } from './chat-history-view';

type SidebarView = 'history' | 'search' | 'settings';

/**
 * Props for the ChatSidebar component
 */
interface ChatSidebarProps {
  /** Whether the sidebar is currently open */
  isOpen: boolean;
  /** Callback function called when the sidebar should be closed */
  onClose: () => void;
  /** ID of the currently active chat */
  currentChatId?: string;
  /** Optional callback function called when a chat is selected */
  onSelectChat?: (chatId: string) => void;
  /** Optional callback function called when a new chat should be created */
  onCreateNewChat?: () => void;
  /** Additional CSS classes to apply to the sidebar */
  className?: string;
}

/**
 * ChatSidebar component provides a collapsible sidebar with tabbed navigation for chat tools.
 * Currently includes chat history view with extensible architecture for future features.
 *
 * @param props - The component props
 * @returns JSX element representing the chat sidebar or null if not open
 */
export function ChatSidebar({
  isOpen,
  onClose,
  currentChatId,
  onSelectChat,
  onCreateNewChat,
  className = '',
}: ChatSidebarProps) {
  const [activeView, setActiveView] = useState<SidebarView>('history');

  const handleViewChange = useCallback((view: SidebarView) => {
    setActiveView(view);
  }, []);

  const renderView = useCallback(() => {
    switch (activeView) {
      case 'history':
        return (
          <ChatHistoryView
            currentChatId={currentChatId}
            onSelectChat={onSelectChat}
            onCreateNewChat={onCreateNewChat}
          />
        );
      case 'search':
        return (
          <div className="p-4 text-center text-muted-foreground">
            <p className="text-sm">Search functionality coming soon...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="p-4 text-center text-muted-foreground">
            <p className="text-sm">Settings coming soon...</p>
          </div>
        );
      default:
        return null;
    }
  }, [activeView, currentChatId, onSelectChat, onCreateNewChat]);

  if (!isOpen) return null;

  return (
    <div className={cn('flex flex-col h-full bg-background overflow-hidden', className)}>
      {/* Header with tabs */}
      <div className="flex-shrink-0 border-b">
        <div className="flex items-center justify-between p-3">
          <h3 className="font-semibold text-sm">Chat Tools</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
            title="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b">
          <Button
            variant={activeView === 'history' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handleViewChange('history')}
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            data-state={activeView === 'history' ? 'active' : 'inactive'}
          >
            <History className="h-4 w-4 mr-1" />
            History
          </Button>
          {/* Future tabs can be added here */}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">{renderView()}</div>
    </div>
  );
}
