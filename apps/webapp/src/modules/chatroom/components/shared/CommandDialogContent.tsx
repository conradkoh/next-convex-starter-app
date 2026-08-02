'use client';

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';

import {
  COMMAND_DIALOG_CONTENT_CLASSES,
  COMMAND_DIALOG_DISMISS_BACKDROP_CLASSES,
  getCommandDialogContentStyle,
} from './commandDialogStyles';

import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useVisualViewportOffsetTop } from '@/hooks/useMobileKeyboard';
import { cn } from '@/lib/utils';

type CommandDialogContentProps = React.ComponentProps<typeof DialogPrimitive.Popup> & {
  /** Gate viewport tracking and dismiss backdrop — pass dialog open state */
  open: boolean;
};

/**
 * Shared Dialog.Popup for command-style dialogs (Cmd+K, Cmd+P, Cmd+Shift+P).
 * Applies COMMAND_DIALOG_CONTENT_CLASSES and, on mobile when the software
 * keyboard scrolls the layout viewport, anchors the dialog to the visible
 * viewport top via an inline `top` override.
 *
 * Renders a transparent dismiss backdrop (gated on `open`) below the content
 * to intercept outside pointer events without a visible/dimming overlay.
 *
 * Uses `keepMounted` on the Portal (Base UI equivalent of Radix forceMount) so
 * the popup stays mounted for the exit animation driven by
 * `data-closed:fill-mode-forwards` / `data-closed:pointer-events-none`.
 */
export function CommandDialogContent({
  open,
  className,
  style,
  onEscapeKeyDown,
  ...props
}: CommandDialogContentProps & {
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
}) {
  const isDesktop = useIsDesktop(640); // matches sm: breakpoint in COMMAND_DIALOG_CONTENT_CLASSES
  const viewportOffsetTopPx = useVisualViewportOffsetTop(open && !isDesktop);
  const viewportStyle = getCommandDialogContentStyle(viewportOffsetTopPx);

  // Intercept Escape so consumers can clear search / defer close before Base
  // UI's document-level handler runs. preventDefault() signals "keep open".
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== 'Escape' || !onEscapeKeyDown) return;
    onEscapeKeyDown(event.nativeEvent);
    if (event.defaultPrevented) {
      event.stopPropagation();
    }
  };

  return (
    <DialogPrimitive.Portal keepMounted>
      {open ? (
        <div
          data-slot="command-dialog-dismiss-backdrop"
          aria-hidden="true"
          className={COMMAND_DIALOG_DISMISS_BACKDROP_CLASSES}
        />
      ) : null}
      <DialogPrimitive.Popup
        className={cn(...COMMAND_DIALOG_CONTENT_CLASSES, className)}
        style={{ ...viewportStyle, ...style }}
        onKeyDown={handleKeyDown}
        {...props}
      />
    </DialogPrimitive.Portal>
  );
}
