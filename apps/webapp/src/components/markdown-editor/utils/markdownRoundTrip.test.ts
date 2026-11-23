import { Editor, type JSONContent } from '@tiptap/core';
import { normalizeMarkdownContent } from '@workspace/shared/utilities/markdown';
import { describe, expect, it, vi } from 'vitest';

import { createMarkdownEditorExtensions } from '../extensions/markdownEditorExtensions';

// `Editor.getJSON()` is typed against extension instances (NodeType/TextType) rather than the
// document JSON it actually returns, so read it through the JSON document type for nested access.
function getEditorJson(editor: Editor): JSONContent {
  return editor.getJSON() as unknown as JSONContent;
}

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

describe('nested list round trip', () => {
  it.each([
    '1. one\n   - nested\n   - nested two\n2. two',
    '10. ten\n    - nested\n    - nested two\n11. eleven',
    '- a\n  - b\n  - c\n- d',
    '1. one\n   - nested\n     - deep\n   - sib\n2. two',
    '- a\n  - b\n    1. x\n    2. y\n- d',
    '1. one\n   1. sub\n   2. sub2\n2. two',
    '9. nine\n   - x\n   - y\n10. ten\n    - x\n    - y',
  ])('keeps %j byte-identical over three save/load cycles', (markdown) => {
    let current = markdown;
    for (let cycle = 1; cycle <= 3; cycle++) {
      current = withEditor(current, (editor) => editor.getMarkdown());
      expect(current, `cycle ${cycle}`).toBe(markdown);
    }
  });

  it('keeps the mixed ordered/bullet nesting depth and sibling count in editor JSON', () => {
    const markdown = '1. one\n   - nested\n     - deep\n   - sib\n2. two';
    const json = withEditor(markdown, getEditorJson);
    const ordered = json.content?.[0];
    expect(ordered?.type).toBe('orderedList');
    expect(ordered?.content?.length).toBe(2);
    const nestedList = ordered?.content?.[0]?.content?.[1];
    expect(nestedList?.type).toBe('bulletList');
    expect(nestedList?.content?.length).toBe(2);
    expect(nestedList?.content?.[0]?.content?.[1]?.type).toBe('bulletList');
  });

  // The editor already registers a duplicate `link` extension (P4 scope), so this checks the
  // property this suite owns: the custom list item must not add a second `listItem` node type.
  it('does not log a duplicate list item extension warning when the editor loads', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      withEditor('- a', (editor) => editor.getMarkdown());
      expect(warn.mock.calls.flat().join('\n')).not.toMatch(
        /Duplicate extension names found: \[[^\]]*'listItem'/
      );
    } finally {
      warn.mockRestore();
    }
  });
});
