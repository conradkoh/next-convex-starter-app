import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MarkdownToolbar } from './MarkdownToolbar';

type Caret = { name: string; attrs?: { level?: number } };

/** A fake Tiptap editor with a movable caret. Only the members the toolbar touches are implemented. */
function fakeEditor(initial: Caret) {
  let caret = initial;
  const listeners = new Map<string, Set<(props: unknown) => void>>();
  const editor = {
    isActive: (name: string, attrs?: { level?: number }) =>
      caret.name === name && (attrs === undefined || caret.attrs?.level === attrs.level),
    on: (event: string, listener: (props: unknown) => void) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)?.add(listener);
    },
    off: (event: string, listener: (props: unknown) => void) => {
      listeners.get(event)?.delete(listener);
    },
    getAttributes: () => ({}),
    getMarkdown: () => 'Hi',
    chain: () => ({
      focus: () => ({
        toggleBold: () => ({ run: vi.fn() }),
        toggleItalic: () => ({ run: vi.fn() }),
        toggleHeading: () => ({ run: vi.fn() }),
        toggleBulletList: () => ({ run: vi.fn() }),
        toggleOrderedList: () => ({ run: vi.fn() }),
        toggleCode: () => ({ run: vi.fn() }),
        extendMarkRange: () => ({
          setLink: () => ({ run: vi.fn() }),
          unsetLink: () => ({ run: vi.fn() }),
        }),
      }),
    }),
  };
  return {
    editor,
    /** Moves the caret and emits a transaction, the way a selection change does in Tiptap. */
    moveCaret(next: Caret) {
      caret = next;
      for (const listener of listeners.get('transaction') ?? []) listener({ transaction: {} });
    },
  };
}

describe('MarkdownToolbar', () => {
  it('copies the editor markdown source', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const editor = fakeEditor({ name: 'paragraph' }).editor as never;

    render(<MarkdownToolbar editor={editor} />);
    fireEvent.click(screen.getByTitle('Copy markdown'));

    expect(writeText).toHaveBeenCalledWith('Hi');
  });

  it('moves the active heading with the caret and clears it when the caret leaves', () => {
    const fake = fakeEditor({ name: 'paragraph' });
    render(<MarkdownToolbar editor={fake.editor as never} />);
    expect(screen.getByTitle('Heading 2')).not.toHaveClass('bg-foreground/10');

    act(() => fake.moveCaret({ name: 'heading', attrs: { level: 1 } }));
    expect(screen.getByTitle('Heading 1')).toHaveClass('bg-foreground/10');

    act(() => fake.moveCaret({ name: 'heading', attrs: { level: 2 } }));
    expect(screen.getByTitle('Heading 2')).toHaveClass('bg-foreground/10');
    expect(screen.getByTitle('Heading 1')).not.toHaveClass('bg-foreground/10');
    expect(screen.getByTitle('Heading 3')).not.toHaveClass('bg-foreground/10');

    act(() => fake.moveCaret({ name: 'paragraph' }));
    expect(screen.getByTitle('Heading 2')).not.toHaveClass('bg-foreground/10');
  });
});
