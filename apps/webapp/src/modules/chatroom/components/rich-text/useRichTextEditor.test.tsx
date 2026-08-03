// @vitest-environment jsdom

import { render, waitFor } from '@testing-library/react';
import { EditorContent } from '@tiptap/react';
import { act, useEffect, useState } from 'react';
import { beforeAll, describe, expect, it } from 'vitest';

import { useRichTextEditor } from './useRichTextEditor';

type RichTextEditorInstance = NonNullable<ReturnType<typeof useRichTextEditor>['editor']>;

let latestEditor: RichTextEditorInstance | undefined;

function ControlledEditorHarness({ value }: { value: string }) {
  const [content, setContent] = useState(value);
  const { editor } = useRichTextEditor({ content, onUpdate: setContent });

  useEffect(() => {
    setContent(value);
  }, [value]);

  if (editor) {
    latestEditor = editor;
  }

  if (!editor) return null;

  return <EditorContent editor={editor} />;
}

describe('useRichTextEditor controlled sync', () => {
  beforeAll(() => {
    if (typeof document.elementFromPoint !== 'function') {
      document.elementFromPoint = () => null;
    }
  });

  it('preserves cursor position on internal updates (insert mid-string)', async () => {
    latestEditor = undefined;
    render(<ControlledEditorHarness value="hello world" />);

    await waitFor(() => expect(latestEditor).toBeDefined());

    act(() => {
      latestEditor!.commands.setTextSelection(6);
      latestEditor!.commands.insertContent('X');
    });

    await waitFor(() => {
      const selectionAfter = latestEditor!.state.selection.from;
      const docEnd = latestEditor!.state.doc.content.size;
      expect(selectionAfter).toBeLessThan(docEnd);
      expect(latestEditor!.getText()).toContain('helloX');
    });
  });

  it('syncs external value changes into the editor', async () => {
    const { rerender } = render(<ControlledEditorHarness value="original content" />);

    await waitFor(() => {
      expect(document.querySelector('.ProseMirror')?.textContent).toContain('original');
    });

    rerender(<ControlledEditorHarness value="reset content" />);

    await waitFor(() => {
      expect(document.querySelector('.ProseMirror')?.textContent).toContain('reset content');
    });
  });
});
