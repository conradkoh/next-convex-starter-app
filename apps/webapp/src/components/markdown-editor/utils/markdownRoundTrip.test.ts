import { Editor } from '@tiptap/core';
import { normalizeMarkdownContent } from '@workspace/shared/utilities/markdown';
import { describe, expect, it } from 'vitest';

import { createMarkdownEditorExtensions } from '../extensions/markdownEditorExtensions';

function withEditor<T>(markdown: string, read: (editor: Editor) => T): T {
  const editor = new Editor({
    extensions: createMarkdownEditorExtensions(),
    content: normalizeMarkdownContent(markdown),
    contentType: 'markdown',
  });
  try {
    return read(editor);
  } finally {
    editor.destroy();
  }
}

describe('markdown editor round trip', () => {
  it('keeps heading and list structure when the document ends with a raw tag', () => {
    const markdown = '# Title\n\n- a\n- b\n\n<div>x</div>';
    const json = withEditor(markdown, (editor) => editor.getJSON());
    expect(json.content?.[0]?.type).toBe('heading');
    expect(json.content?.[1]?.type).toBe('bulletList');
    expect(json.content?.[1]?.content?.length).toBe(2);
    expect(json.content?.[1]?.content?.[0]?.type).toBe('listItem');

    const saved = withEditor(markdown, (editor) => editor.getMarkdown());
    expect(saved).toContain('# Title');
    expect(saved).toContain('- a');
    expect(saved).toContain('- b');
  });

  it('loads leading indentation as a code block', () => {
    const json = withEditor('    const x = 1\n    const y = 2', (editor) => editor.getJSON());
    expect(json.content?.[0]?.type).toBe('codeBlock');
  });

  it('round-trips fenced code containing entities byte-identically', () => {
    const markdown = '```\n&amp; &lt;\n```';
    expect(withEditor(markdown, (editor) => editor.getMarkdown())).toBe(markdown);
  });

  it('round-trips inline code containing entities byte-identically', () => {
    const markdown = 'Use `&amp;` and `&lt;` here';
    expect(withEditor(markdown, (editor) => editor.getMarkdown())).toBe(markdown);
  });
});
