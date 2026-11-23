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

function withJsonEditor<T>(json: JSONContent, read: (editor: Editor) => T): T {
  const editor = new Editor({ extensions: createMarkdownEditorExtensions(), content: json });
  try {
    return read(editor);
  } finally {
    editor.destroy();
  }
}

function paragraphJson(...content: JSONContent[]): JSONContent {
  return { type: 'doc', content: [{ type: 'paragraph', content }] };
}

function textJson(text: string): JSONContent {
  return { type: 'text', text };
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

  it('round-trips a link byte-identically over two cycles', () => {
    const markdown = '[x](https://a)';
    const saved = withEditor(markdown, (editor) => editor.getMarkdown());
    expect(saved).toBe(markdown);
    expect(withEditor(saved, (editor) => editor.getMarkdown())).toBe(markdown);
  });

  it('configures the link mark so a click does not open the URL', () => {
    const editor = new Editor({ extensions: createMarkdownEditorExtensions() });
    try {
      const link = editor.extensionManager.extensions.find(
        (extension) => extension.name === 'link'
      );
      expect(link?.options.openOnClick).toBe(false);
    } finally {
      editor.destroy();
    }
  });

  it('round-trips inline code containing entities byte-identically', () => {
    const markdown = 'Use `&amp;` and `&lt;` here';
    expect(withEditor(markdown, (editor) => editor.getMarkdown())).toBe(markdown);
  });
});

describe('empty list item sentinel', () => {
  const emptyListItem = { type: 'listItem', content: [{ type: 'paragraph' }] };

  it.each([
    '- a\n- &nbsp;\n- b', // middle
    '- a\n- &nbsp;', // end
    '- &nbsp;', // only item
    '- a\n- \u00A0\n- b', // legacy NBSP from earlier saves
  ])('loads %j with an empty listItem and no literal sentinel text', (markdown) => {
    const json = withEditor(markdown, getEditorJson);
    const items = json.content?.[0]?.content ?? [];
    expect(items).toContainEqual(emptyListItem);
    expect(JSON.stringify(json)).not.toContain('&nbsp;');
  });
});

describe('empty paragraph and list item round trip', () => {
  it('writes the empty item and blank line as the ASCII sentinel on the first save', () => {
    expect(withEditor('- a\n-\n\nnext', (editor) => editor.getMarkdown())).toBe(
      '- a\n- &nbsp;\n\nnext'
    );
  });

  it('reloads a loose item whose first paragraph is empty and keeps the second paragraph', () => {
    const json: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                { type: 'paragraph', content: [] },
                { type: 'paragraph', content: [textJson('para')] },
              ],
            },
          ],
        },
      ],
    };
    const saved = withJsonEditor(json, (editor) => editor.getMarkdown());
    expect(saved).toBe('- &nbsp;\n\n  para');

    const reloaded = withEditor(saved, getEditorJson);
    const item = reloaded.content?.[0]?.content?.[0];
    expect(item?.content?.[0]?.type).toBe('paragraph');
    expect(item?.content?.[0]?.content ?? []).toHaveLength(0);
    expect(item?.content?.[1]?.content?.[0]?.text).toBe('para');
    expect(withEditor(saved, (editor) => editor.getMarkdown())).toBe(saved);
  });

  it('keeps the first save byte-identical across four more cycles', () => {
    const first = withEditor('- a\n-\n\nnext', (editor) => editor.getMarkdown());
    let current = first;
    for (let cycle = 1; cycle <= 4; cycle++) {
      current = withEditor(current, (editor) => editor.getMarkdown());
      expect(current, `cycle ${cycle}`).toBe(first);
    }
  });

  it.each([
    '- a\n- &nbsp;\n- b',
    '- a\n- &nbsp;',
    '- &nbsp;',
    '- &nbsp;\n  - nested',
    'a\n\n&nbsp;\n\nb',
    '- a\n\n&nbsp;\n\nnext',
    '- a\n\n  second para\n- b',
    '- a  \nhard\n- b',
    '- a\n  ```\n  code\n  ```',
  ])('keeps %j byte-identical over four save/load cycles with no U+00A0', (markdown) => {
    let current = markdown;
    for (let cycle = 1; cycle <= 4; cycle++) {
      current = withEditor(current, (editor) => editor.getMarkdown());
      expect(current, `cycle ${cycle}`).toBe(markdown);
      expect(current).not.toContain('\u00A0');
    }
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

  it('does not log a duplicate extension warning when the editor loads', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      withEditor('- a', (editor) => editor.getMarkdown());
      expect(warn.mock.calls.flat().join('\n')).not.toMatch(/Duplicate extension names/);
    } finally {
      warn.mockRestore();
    }
  });
});

describe('paragraph text that looks like block syntax', () => {
  const blockTypes = ['horizontalRule', 'orderedList', 'bulletList', 'heading', 'blockquote'];

  it.each([
    '---',
    '===',
    '--',
    '1. not a list',
    '> not a quote',
    '# not a heading',
    '- not a bullet',
    '+ plus',
    '-',
    '+',
    '#',
    '1)',
  ])('reloads %j as paragraph text over two cycles', (text) => {
    const saved = withJsonEditor(paragraphJson(textJson(text)), (editor) => editor.getMarkdown());
    const reloaded = withEditor(saved, getEditorJson);
    const block = reloaded.content?.[0];
    expect(block?.type).toBe('paragraph');
    expect(block?.content).toHaveLength(1);
    expect(block?.content?.[0]?.type).toBe('text');
    expect(block?.content?.[0]?.text).toBe(text);
    expect(block?.content?.[0]?.marks ?? []).toEqual([]);
    for (const type of blockTypes) {
      expect(JSON.stringify(reloaded)).not.toContain(`"${type}"`);
    }

    const savedAgain = withEditor(saved, (editor) => editor.getMarkdown());
    expect(savedAgain).toBe(saved);
  });

  it('reloads a hard break followed by block syntax as paragraph text', () => {
    const json = paragraphJson(textJson('a'), { type: 'hardBreak' }, textJson('- hard'));
    const saved = withJsonEditor(json, (editor) => editor.getMarkdown());
    expect(saved).toBe('a  \n\\- hard');

    const reloaded = withEditor(saved, getEditorJson);
    const block = reloaded.content?.[0];
    expect(block?.type).toBe('paragraph');
    expect(block?.content?.map((child) => child.type)).toEqual(['text', 'hardBreak', 'text']);
    expect(block?.content?.[0]?.text).toBe('a');
    expect(block?.content?.[2]?.text).toBe('- hard');

    expect(withEditor(saved, (editor) => editor.getMarkdown())).toBe(saved);
  });

  it.each(['===', '--'])(
    'reloads a hard break followed by a pure underline %j as paragraph text',
    (underline) => {
      const json = paragraphJson(textJson('foo'), { type: 'hardBreak' }, textJson(underline));
      const saved = withJsonEditor(json, (editor) => editor.getMarkdown());
      expect(saved).toBe(`foo  \n\\${underline}`);

      const reloaded = withEditor(saved, getEditorJson);
      const block = reloaded.content?.[0];
      expect(block?.type).toBe('paragraph');
      expect(block?.content?.map((child) => child.type)).toEqual(['text', 'hardBreak', 'text']);
      expect(block?.content?.[2]?.text).toBe(underline);

      expect(withEditor(saved, (editor) => editor.getMarkdown())).toBe(saved);
    }
  );

  it('reloads a newline inside one text node as paragraph text', () => {
    const saved = withJsonEditor(paragraphJson(textJson('a\n- b')), (editor) =>
      editor.getMarkdown()
    );
    expect(saved).toBe('a\n\\- b');

    const reloaded = withEditor(saved, getEditorJson);
    const block = reloaded.content?.[0];
    expect(block?.type).toBe('paragraph');
    expect(block?.content?.map((child) => child.text).join('')).toBe('a\n- b');
  });

  it.each([
    ['<b>x</b>', '&lt;b&gt;x&lt;/b&gt;'],
    ['<b>', '&lt;b&gt;'],
    ['<div>literal</div>', '&lt;div&gt;literal&lt;/div&gt;'],
  ])('reloads literal HTML text %j as the same text', (text, saved) => {
    expect(withJsonEditor(paragraphJson(textJson(text)), (editor) => editor.getMarkdown())).toBe(
      saved
    );
    // The save is entity-encoded text, never HTML markup.
    const reloaded = withEditor(saved, getEditorJson);
    const block = reloaded.content?.[0];
    expect(block?.type).toBe('paragraph');
    expect(block?.content?.map((child) => child.text).join('')).toBe(text);
    expect(block?.content?.[0]?.marks ?? []).toEqual([]);
    expect(withEditor(saved, (editor) => editor.getMarkdown())).toBe(saved);
  });

  it('keeps a literal > at line start as paragraph text', () => {
    const saved = withJsonEditor(paragraphJson(textJson('> not a quote')), (editor) =>
      editor.getMarkdown()
    );
    expect(saved).toBe('&gt; not a quote');
    const reloaded = withEditor(saved, getEditorJson);
    expect(reloaded.content?.[0]?.type).toBe('paragraph');
    expect(reloaded.content?.[0]?.content?.[0]?.text).toBe('> not a quote');
  });

  it('reloads user-typed &nbsp; text as literal text, not an empty paragraph', () => {
    const saved = withJsonEditor(paragraphJson(textJson('&nbsp;')), (editor) =>
      editor.getMarkdown()
    );
    expect(saved).toBe('&amp;nbsp;');

    const reloaded = withEditor(saved, getEditorJson);
    const block = reloaded.content?.[0];
    expect(block?.type).toBe('paragraph');
    expect(block?.content?.[0]?.text).toBe('&nbsp;');
    expect(withEditor(saved, (editor) => editor.getMarkdown())).toBe(saved);
  });

  it('leaves text that is not actually a block start unescaped', () => {
    for (const text of ['-- x', '#tag', '-5 degrees', '1.5 x']) {
      expect(withJsonEditor(paragraphJson(textJson(text)), (editor) => editor.getMarkdown())).toBe(
        text
      );
    }
  });

  it('does not escape a text node that starts mid-line after a mark', () => {
    const json = paragraphJson(
      { type: 'text', text: 'b', marks: [{ type: 'bold' }] },
      textJson('- x')
    );
    expect(withJsonEditor(json, (editor) => editor.getMarkdown())).toBe('**b**- x');
  });
});

describe('marked text that contains block syntax', () => {
  it('escapes a line-start marker inside a bold text node and keeps the bold mark', () => {
    const json = paragraphJson({ type: 'text', text: 'a\n- b', marks: [{ type: 'bold' }] });
    const saved = withJsonEditor(json, (editor) => editor.getMarkdown());
    expect(saved).toBe('**a\n\\- b**');

    const reloaded = withEditor(saved, getEditorJson);
    const block = reloaded.content?.[0];
    expect(block?.type).toBe('paragraph');
    expect(block?.content?.map((child) => child.text).join('')).toBe('a\n- b');
    for (const child of block?.content ?? []) {
      expect(child.marks?.map((mark) => mark.type)).toEqual(['bold']);
    }
    expect(withEditor(saved, (editor) => editor.getMarkdown())).toBe(saved);
  });

  it('escapes a line-start marker inside an italic text node', () => {
    const json = paragraphJson({ type: 'text', text: 'a\n# b', marks: [{ type: 'italic' }] });
    const saved = withJsonEditor(json, (editor) => editor.getMarkdown());
    expect(saved).toBe('*a\n\\# b*');

    const reloaded = withEditor(saved, getEditorJson);
    const block = reloaded.content?.[0];
    expect(block?.type).toBe('paragraph');
    expect(block?.content?.map((child) => child.text).join('')).toBe('a\n# b');
    for (const child of block?.content ?? []) {
      expect(child.marks?.map((mark) => mark.type)).toEqual(['italic']);
    }
    expect(withEditor(saved, (editor) => editor.getMarkdown())).toBe(saved);
  });

  it('does not escape a marked text node that starts with a marker at the run start', () => {
    const json = paragraphJson({ type: 'text', text: '- b', marks: [{ type: 'bold' }] });
    expect(withJsonEditor(json, (editor) => editor.getMarkdown())).toBe('**- b**');
  });

  it('escapes the bold text and leaves the code text raw in one run', () => {
    const json = paragraphJson(
      { type: 'text', text: 'a\n- b', marks: [{ type: 'bold' }] },
      { type: 'text', text: 'c\n- d', marks: [{ type: 'code' }] }
    );
    expect(withJsonEditor(json, (editor) => editor.getMarkdown())).toBe('**a\n\\- b**`c\n- d`');
  });
});

describe('code is never escaped', () => {
  it('keeps inline code byte-identical over three cycles', () => {
    const markdown = 'Use `---` and `# x` and `1. x` and `> x` and `<b>` here';
    let current = markdown;
    for (let cycle = 1; cycle <= 3; cycle++) {
      current = withEditor(current, (editor) => editor.getMarkdown());
      expect(current, `cycle ${cycle}`).toBe(markdown);
    }
  });

  it('keeps fenced code byte-identical over three cycles', () => {
    const markdown = '```\n---\n# x\n1. x\n> x\n<b>\n```';
    let current = markdown;
    for (let cycle = 1; cycle <= 3; cycle++) {
      current = withEditor(current, (editor) => editor.getMarkdown());
      expect(current, `cycle ${cycle}`).toBe(markdown);
    }
  });

  it('keeps a code-only paragraph with a line-start marker byte-identical', () => {
    const json = paragraphJson({ type: 'text', text: 'c\n- d', marks: [{ type: 'code' }] });
    expect(withJsonEditor(json, (editor) => editor.getMarkdown())).toBe('`c\n- d`');
  });
});

describe('ordered list type', () => {
  it('saves an ordered list with a non-decimal type attribute as decimal markers', () => {
    const json: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'orderedList',
          attrs: { start: 1, type: 'a' },
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [textJson('one')] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [textJson('two')] }] },
          ],
        },
      ],
    };
    const editor = new Editor({ extensions: createMarkdownEditorExtensions(), content: json });
    try {
      // Guard: the type attribute must survive into the editor, or the test proves nothing.
      expect(getEditorJson(editor).content?.[0]?.attrs?.type).toBe('a');
      expect(editor.getMarkdown()).toBe('1. one\n2. two');
    } finally {
      editor.destroy();
    }
  });
});
