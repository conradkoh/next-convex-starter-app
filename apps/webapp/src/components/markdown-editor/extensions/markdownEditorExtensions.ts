import type { JSONContent } from '@tiptap/core';
import Link from '@tiptap/extension-link';
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
// fallow-ignore-next-line unused-export
export function escapeBlockStarts(rendered: string, atLineStart: boolean): string {
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

function isPlainText(child: JSONContent): boolean {
  return child.type === 'text' && !child.marks?.length;
}

export const ParagraphWithBlankLinePreservation = Paragraph.extend({
  renderMarkdown(node, h) {
    const content = Array.isArray(node.content) ? node.content : [];
    if (content.length === 0) return '&nbsp;';

    // Escape block-start markers only in plain text nodes, and only at a real line start. Marked
    // nodes are rendered as a single run so mark boundaries that span siblings (for example a bold
    // span around a hard break, or an inline code span) stay byte-identical.
    let output = '';
    let markedRun: JSONContent[] = [];
    const flushMarkedRun = () => {
      if (markedRun.length === 0) return;
      output += h.renderChildren(markedRun);
      markedRun = [];
    };
    const renderChild = h.renderChild ?? ((child: JSONContent) => h.renderChildren(child));

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
    StarterKit.configure({ heading: { levels: [1, 2, 3] }, paragraph: false, listItem: false }),
    CodeBlockLineBoundarySelection,
    ParagraphWithBlankLinePreservation,
    ListItemWithMarkerWidthIndent,
    ...(placeholder ? [Placeholder.configure({ placeholder })] : []),
    Link.configure({ openOnClick: false }),
    Markdown,
  ];
}
