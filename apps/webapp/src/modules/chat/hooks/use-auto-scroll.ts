import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Options for configuring the useAutoScroll hook
 */
interface UseAutoScrollOptions {
  /**
   * Threshold in pixels from bottom to consider "at bottom"
   * Default: 100
   */
  threshold?: number;
  /**
   * Dependencies that should trigger auto-scroll when changed
   * (e.g., messages array, streaming content)
   */
  dependencies?: unknown[];
}

/**
 * Return type for the useAutoScroll hook
 */
interface UseAutoScrollReturn {
  /** Ref to attach to the scrollable container */
  scrollRef: React.RefObject<HTMLDivElement | null>;
  /** Whether the user is currently at the bottom of the scroll area */
  isAtBottom: boolean;
  /** Whether the user has manually scrolled up (detached from auto-scroll) */
  isDetached: boolean;
  /** Scroll event handler to attach to the scrollable container */
  handleScroll: () => void;
  /** Function to manually scroll to bottom and re-attach auto-scroll */
  scrollToBottom: () => void;
}

/**
 * Custom hook for managing auto-scroll behavior in chat interfaces.
 *
 * Features:
 * - Automatically scrolls to bottom when new content is added
 * - Detects when user manually scrolls up and stops auto-scrolling
 * - Provides manual scroll-to-bottom functionality
 * - Smooth scrolling animations
 * - Configurable threshold for "at bottom" detection
 *
 * @param options - Configuration options for the hook
 * @returns Object containing scroll ref, state, and control functions
 */
export function useAutoScroll({
  threshold = 100,
  dependencies = [],
}: UseAutoScrollOptions = {}): UseAutoScrollReturn {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isDetached, setIsDetached] = useState(false);
  const lastScrollTop = useRef<number>(0);
  const isScrollingProgrammatically = useRef(false);

  // Check if user is at the bottom of the scroll area
  const checkIfAtBottom = useCallback(() => {
    try {
      const element = scrollRef.current;
      if (!element) return false;

      const { scrollTop, scrollHeight, clientHeight } = element;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      return distanceFromBottom <= threshold;
    } catch (error) {
      console.warn('Error checking scroll position:', error);
      return false;
    }
  }, [threshold]);

  // Scroll to bottom smoothly
  const scrollToBottomInternal = useCallback((smooth = true) => {
    try {
      const element = scrollRef.current;
      if (!element) return;

      isScrollingProgrammatically.current = true;
      element.scrollTo({
        top: element.scrollHeight,
        behavior: smooth ? 'smooth' : 'instant',
      });

      // Reset the flag after a short delay
      setTimeout(() => {
        isScrollingProgrammatically.current = false;
      }, 100);
    } catch (error) {
      console.warn('Error scrolling to bottom:', error);
      isScrollingProgrammatically.current = false;
    }
  }, []);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    try {
      const element = scrollRef.current;
      if (!element || isScrollingProgrammatically.current) return;

      const currentScrollTop = element.scrollTop;
      const atBottom = checkIfAtBottom();

      setIsAtBottom(atBottom);

      // Detect if user scrolled up manually (detached mode)
      if (currentScrollTop < lastScrollTop.current && !atBottom) {
        setIsDetached(true);
      } else if (atBottom) {
        // User scrolled back to bottom, re-attach
        setIsDetached(false);
      }

      lastScrollTop.current = currentScrollTop;
    } catch (error) {
      console.warn('Error handling scroll event:', error);
    }
  }, [checkIfAtBottom]);

  // Auto-scroll when dependencies change (new messages, streaming updates)
  useEffect(() => {
    if (!isDetached && isAtBottom) {
      // Small delay to ensure DOM has updated
      const timeoutId = setTimeout(() => {
        scrollToBottomInternal(true);
      }, 10);
      return () => clearTimeout(timeoutId);
    }
  }, [isDetached, isAtBottom, scrollToBottomInternal, ...dependencies]);

  // Initial scroll to bottom when component mounts
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollToBottomInternal(false);
    }, 50);
    return () => clearTimeout(timeoutId);
  }, [scrollToBottomInternal]);

  // Force scroll to bottom (for manual triggers)
  const forceScrollToBottom = useCallback(() => {
    setIsDetached(false);
    setIsAtBottom(true);
    scrollToBottomInternal(true);
  }, [scrollToBottomInternal]);

  return {
    scrollRef,
    isAtBottom,
    isDetached,
    handleScroll,
    scrollToBottom: forceScrollToBottom,
  };
}
