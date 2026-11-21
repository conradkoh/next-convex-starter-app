import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_COPY_KEY = 'default';

export interface UseCopyToClipboardResult {
  /** Key whose copy succeeded. Cleared `resetMs` after success. */
  copiedKey: string | null;
  /** Key whose last copy failed. Kept until the next copy() call. */
  failedKey: string | null;
  /** Writes text to the clipboard. Resolves true on success, false on failure. */
  copy: (text: string, key?: string) => Promise<boolean>;
}

/**
 * Shared copy feedback. A success marks `copiedKey` for `resetMs` (drives an icon swap).
 * A failure marks `failedKey` until the next copy attempt. No toasts.
 */
export function useCopyToClipboard(resetMs = 2000): UseCopyToClipboardResult {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (resetTimerRef.current !== null) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
    };
  }, []);

  const copy = useCallback(
    async (text: string, key: string = DEFAULT_COPY_KEY): Promise<boolean> => {
      if (resetTimerRef.current !== null) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
      setFailedKey(null);
      try {
        await navigator.clipboard.writeText(text);
      } catch (error) {
        console.error('Failed to copy text: ', error);
        if (isMountedRef.current) {
          setCopiedKey(null);
          setFailedKey(key);
        }
        return false;
      }
      if (isMountedRef.current) {
        setCopiedKey(key);
        resetTimerRef.current = setTimeout(() => {
          resetTimerRef.current = null;
          setCopiedKey(null);
        }, resetMs);
      }
      return true;
    },
    [resetMs]
  );

  return { copiedKey, failedKey, copy };
}
