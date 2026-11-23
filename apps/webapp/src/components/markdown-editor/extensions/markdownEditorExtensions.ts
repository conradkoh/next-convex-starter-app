import type { JSONContent } from '@tiptap/core';
import Paragraph from '@tiptap/extension-paragraph';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from '@tiptap/markdown';
import StarterKit from '@tiptap/starter-kit';

import { CodeBlockLineBoundarySelection } from './codeBlockLineBoundarySelection';
import { ListItemWithMarkerWidthIndent } from './markdownListItem';

// Block-start markers at a line start (after up to three spaces): a bullet or thematic-break hyphen
// run, `+`, an ATX `#` run (1–6), or a decimal number followed by `.` or `)` and then a space or end
// of line. `-5`, `-- x`, `#tag`, and `1.5` are not block starts and are left alone.
const BLOCK_START_PATTERN = /^( {0,3})(?:(-{3,}|-|\+|#{1,6})(?=\s|$)|(\d{1,9})([.)])(?=\s|$))/gm;

// `rendered` is the already-encoded output of one plain text node. `atLineStart` says whether the
// node begins a line; line starts after a `\n` inside the node are always checked.
function escapeBlockStarts(rendered: string, atLineStart: boolean): string {
  return rendered.replace(
    BLOCK_START_PATTERN,
    (
      match,
      indent: string,
      marker: string | undefined,
      digits: string | undefined,
      punct: string | undefined,
      offset: number
    ) => {
      // The regex also matches at offset 0; that is only a real line start when the node starts one.
      if (offset === 0 && !atLineStart) return match;
      return marker ? `${indent}\\${marker}` : `${indent}${digits}\\${punct}`;
    }
  );
}

// Placeholder for a code-marked text node while a marked run is escaped. U+E000 and U+E001 are
// private-use characters that markdown syntax never uses, and BLOCK_START_PATTERN cannot match
// them, so a placeholder passes through escaping unchanged and is swapped back afterwards.
const CODE_PLACEHOLDER_PATTERN = /\uE000(\d+)\uE001/g;

function isPlainText(child: JSONContent): boolean {
  return child.type === 'text' && !child.marks?.length;
}

function isCodeMarked(child: JSONContent): boolean {
  return (child.marks ?? []).some((mark) => mark.type === 'code');
}

export const ParagraphWithBlankLinePreservation = Paragraph.extend({
  renderMarkdown(node, h) {
    const content = Array.isArray(node.content) ? node.content : [];
    if (content.length === 0) return '&nbsp;';

    const renderChild = h.renderChild ?? ((child: JSONContent) => h.renderChildren(child));

    // Renders one run of marked or non-text children and escapes its non-code text at real line
    // starts, including line starts after a newline inside a mark. Each code-marked text node is
    // replaced by a numbered placeholder while escaping, then restored byte-for-byte.
    const renderMarkedRun = (run: JSONContent[], atLineStart: boolean): string => {
      const codeTexts: string[] = [];
      const masked = run.map((child): JSONContent => {
        if (child.type !== 'text' || !isCodeMarked(child)) return child;
        codeTexts.push(child.text ?? '');
        return { ...child, text: `\uE000${codeTexts.length - 1}\uE001` };
      });
      return escapeBlockStarts(h.renderChildren(masked), atLineStart).replace(
        CODE_PLACEHOLDER_PATTERN,
        (_match, index: string) => codeTexts[Number(index)] ?? ''
      );
    };

    // Plain text is escaped node by node. Marked and non-text children are rendered as one run so
    // mark boundaries that span siblings (a bold span around a hard break, or a bold span next to
    // a code span) stay byte-identical.
    let output = '';
    let markedRun: JSONContent[] = [];
    const flushMarkedRun = () => {
      if (markedRun.length === 0) return;
      output += renderMarkedRun(markedRun, output === '' || output.endsWith('\n'));
      markedRun = [];
    };

    content.forEach((child: JSONContent, index: number) => {
      if (!isPlainText(child)) {
        markedRun.push(child);
        return;
      }
      flushMarkedRun();
      const atLineStart = output === '' || output.endsWith('\n');
      output += escapeBlockStarts(renderChild(child, index), atLineStart);
    });
    flushMarkedRun();

    return output;
  },
});

export function createMarkdownEditorExtensions(placeholder?: string) {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      paragraph: false,
      listItem: false,
      link: { openOnClick: false },
    }),
    CodeBlockLineBoundarySelection,
    ParagraphWithBlankLinePreservation,
    ListItemWithMarkerWidthIndent,
    ...(placeholder ? [Placeholder.configure({ placeholder })] : []),
    Markdown,
  ];
}
