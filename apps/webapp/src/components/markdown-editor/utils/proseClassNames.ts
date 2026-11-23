/**
 * Generic typography preset for standalone MarkdownEditor usage.
 *
 * Mirrors `markdownComponents` (components/markdown-components.tsx), the read-only viewer map: the
 * same sizes, gaps, colours and rules. Sizes and gaps are rem or theme tokens, so a host that sets a
 * body font size (for example Notebook's `.ProseMirror` at a different size) does not scale margins
 * or headings. Inline code stays at 0.875em, as in the viewer.
 * `prose` supplies the base element styling; the arbitrary `[&_…]` utilities override it.
 */
export const defaultMarkdownEditorProseClassNames = [
  // Theme foreground on the prose root, so paragraphs, lists and quotes inherit it, not prose's grey.
  'prose dark:prose-invert max-w-none text-foreground',
  // First block never carries a top margin.
  '[&_.ProseMirror>:first-child]:mt-0',
  // Paragraphs: 16px block gap; paragraphs inside a loose list item keep 8px between themselves.
  '[&_p]:mt-0 [&_p]:mb-4 [&_li>p]:my-0 [&_li>p+p]:mt-2',
  // Lists: 24px indent, 4px item gap, nested lists hug their parent item.
  '[&_ul]:mt-0 [&_ul]:mb-4 [&_ul]:pl-6 [&_ol]:mt-0 [&_ol]:mb-4 [&_ol]:pl-6',
  '[&_li]:my-0 [&_li]:pl-0 [&_li+li]:mt-1 [&_li>ul]:mt-1 [&_li>ul]:mb-0 [&_li>ol]:mt-1 [&_li>ol]:mb-0',
  '[&_li::marker]:text-foreground',
  // Headings: the same token utilities as the viewer (they shrink under 640px via globals.css).
  '[&_h1]:mt-0 [&_h1]:mb-4 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-foreground',
  '[&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:border-b [&_h2]:border-border [&_h2]:pb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground',
  '[&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:tracking-tight [&_h3]:text-foreground',
  '[&_h4]:mt-5 [&_h4]:mb-3 [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:tracking-tight [&_h4]:text-foreground',
  '[&_h5]:mt-4 [&_h5]:mb-2 [&_h5]:text-base [&_h5]:font-semibold [&_h5]:tracking-tight [&_h5]:text-foreground',
  '[&_h6]:mt-4 [&_h6]:mb-2 [&_h6]:text-sm [&_h6]:font-semibold [&_h6]:tracking-tight [&_h6]:text-foreground',
  // Inline emphasis and links use the viewer's theme colours and link weight, not prose's.
  '[&_strong]:text-foreground',
  '[&_a]:font-normal [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-1',
  // Horizontal rule: the viewer's 32px rhythm and border token, not prose's 3em margins.
  '[&_hr]:my-8 [&_hr]:border-border',
  // Blockquote: tinted, bordered, body-size text, upright, no quote marks.
  '[&_blockquote]:my-4 [&_blockquote]:rounded-md [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:bg-muted/30 [&_blockquote]:px-5 [&_blockquote]:py-3 [&_blockquote]:font-normal [&_blockquote]:not-italic [&_blockquote]:text-muted-foreground/80 [&_blockquote_p]:mb-0 [&_blockquote_p]:before:content-none [&_blockquote_p]:after:content-none',
  // Inline code: a bg-muted chip at 0.875em with no backticks.
  '[&_:not(pre)>code]:rounded [&_:not(pre)>code]:border [&_:not(pre)>code]:border-border/50 [&_:not(pre)>code]:bg-muted [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[0.875em] [&_:not(pre)>code]:font-normal [&_:not(pre)>code]:text-foreground [&_code]:before:content-none [&_code]:after:content-none',
  // Fenced code: 14px/22px on bg-muted, bordered, horizontal scroll. Covers fences with no language too.
  '[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:border-border [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:text-[0.875rem]/[1.375rem] [&_pre]:text-foreground',
].join(' ');
