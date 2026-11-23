import {
  renderNestedMarkdownContent,
  type MarkdownParseHelpers,
  type MarkdownParseResult,
  type MarkdownToken,
  type RenderContext,
} from '@tiptap/core';
import ListItem from '@tiptap/extension-list-item';

// Sentinel texts that stand for an empty item or paragraph. The save path writes `&nbsp;`; a legacy
// U+00A0 from earlier saves reads the same.
const EMPTY_SENTINEL_TEXTS = new Set(['&nbsp;', '\u00A0']);

// TipTap binds `parseMarkdown` with `this.parent` set to the parent extension's handler, so the
// default list-item parse stays available for every item that is not the empty sentinel.
type ListItemParseParent = {
  parent?: (token: MarkdownToken, helpers: MarkdownParseHelpers) => MarkdownParseResult;
};

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

// A TIGHT list item has no paragraph token: marked gives its inline content as a `text` token
// directly under `list_item`. TipTap's list-item parse would therefore keep the sentinel as literal
// text, so an item whose whole first line is the sentinel is recognised here and read as empty.
function firstTextOf(token: MarkdownToken): string | undefined {
  const first = token.tokens?.[0];
  return first?.type === 'text' ? first.text : undefined;
}

function isSentinelItemToken(token: MarkdownToken): boolean {
  if (token.type !== 'list_item') {
    return false;
  }
  return EMPTY_SENTINEL_TEXTS.has(firstTextOf(token) ?? '');
}

// The sentinel becomes an empty paragraph; any block tokens after it (a nested list) parse as usual.
function parseEmptyItem(token: MarkdownToken, helpers: MarkdownParseHelpers): MarkdownParseResult {
  const rest = (token.tokens ?? []).slice(1);
  const parseBlocks = helpers.parseBlockChildren ?? helpers.parseChildren;
  return {
    type: 'listItem',
    content: [{ type: 'paragraph', content: [] }, ...(rest.length > 0 ? parseBlocks(rest) : [])],
  };
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
  parseMarkdown(this: ListItemParseParent, token, helpers) {
    if (isSentinelItemToken(token)) {
      return parseEmptyItem(token, helpers);
    }
    // Every other item keeps TipTap's own list-item parse.
    return this.parent?.(token, helpers) ?? [];
  },
});
