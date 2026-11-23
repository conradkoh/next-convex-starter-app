import { renderNestedMarkdownContent, type RenderContext } from '@tiptap/core';
import ListItem from '@tiptap/extension-list-item';

// The parts of the render context this renderer reads: the item's sibling index and the type and
// attributes of its parent list.
type ListItemRenderContext = Pick<RenderContext, 'index' | 'parentType'> & {
  meta?: { parentAttrs?: { start?: unknown } };
};

// Mirrors the marker @tiptap/extension-list writes for a list item: `- ` under a bullet list,
// `N. ` under an ordered list where N = start + index (ordered lists parsed from markdown carry a
// numeric `start` and a null `type`, i.e. decimal). Child lines are indented by the width of this
// marker, so `- ` → 2, `1. ` → 3, `10. ` → 4, `100. ` → 5.
//
// The global `Markdown` `indentation` option must stay at its default: it applies one width to
// every list item, which pulls 2-space children out of a `1. ` or `10. ` item on reload.
function orderedListStart(context: ListItemRenderContext): number {
  return Number(context.meta?.parentAttrs?.start) || 1;
}

function listItemMarker(context: ListItemRenderContext): string {
  if (context.parentType !== 'orderedList') {
    return '- ';
  }
  return `${orderedListStart(context) + (context.index || 0)}. `;
}

export const ListItemWithMarkerWidthIndent = ListItem.extend({
  renderMarkdown(node, helpers, context) {
    const marker = listItemMarker(context);
    return renderNestedMarkdownContent(
      node,
      { ...helpers, indent: (content: string) => ' '.repeat(marker.length) + content },
      marker,
      context
    );
  },
});
