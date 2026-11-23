'use client';
import { type Editor, useEditorState } from '@tiptap/react';
import {
  Bold,
  Check,
  Code,
  Copy,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link,
  List,
  ListOrdered,
} from 'lucide-react';
import { useCallback, useState, type ReactNode } from 'react';

import type { MarkdownContentNormalizer } from '../types';
import { getNormalizedEditorMarkdown } from '../utils/getNormalizedEditorMarkdown';

import { cn } from '@/lib/utils';

const toolbarButtonClass =
  'flex items-center justify-center w-7 h-7 cursor-pointer rounded-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors outline-none focus:outline-none focus-visible:outline-none';
const activeButtonClass = 'bg-foreground/10 text-foreground hover:bg-foreground/10';

/** One toolbar toggle's active state; `attrs` narrows nodes that carry a level, such as headings. */
const isActiveMark = (editor: Editor | null, name: string, attrs?: Record<string, unknown>) =>
  editor?.isActive(name, attrs) ?? false;

/** Used until the editor instance exists, so the selector result is never null after the guard. */
const noActiveMarks = {
  bold: false,
  italic: false,
  h1: false,
  h2: false,
  h3: false,
  bulletList: false,
  orderedList: false,
  code: false,
  link: false,
};
export function MarkdownToolbar({
  editor,
  normalizeContent,
}: {
  editor: Editor | null;
  normalizeContent?: MarkdownContentNormalizer;
}) {
  const [copied, setCopied] = useState(false);
  const copyMarkdown = useCallback(async () => {
    if (!editor) return;
    try {
      await navigator.clipboard.writeText(getNormalizedEditorMarkdown(editor, normalizeContent));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy markdown:', error);
    }
  }, [editor, normalizeContent]);
  const active =
    useEditorState({
      editor,
      selector: ({ editor: e }) => ({
        bold: isActiveMark(e, 'bold'),
        italic: isActiveMark(e, 'italic'),
        h1: isActiveMark(e, 'heading', { level: 1 }),
        h2: isActiveMark(e, 'heading', { level: 2 }),
        h3: isActiveMark(e, 'heading', { level: 3 }),
        bulletList: isActiveMark(e, 'bulletList'),
        orderedList: isActiveMark(e, 'orderedList'),
        code: isActiveMark(e, 'code'),
        link: isActiveMark(e, 'link'),
      }),
    }) ?? noActiveMarks;
  if (!editor) return null;
  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl || 'https://');
    if (url === null) return;
    if (!url) editor.chain().focus().extendMarkRange('link').unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };
  const button = (title: string, icon: ReactNode, action: () => void, active = false) => (
    <button
      type="button"
      onClick={action}
      className={cn(toolbarButtonClass, active && activeButtonClass)}
      title={title}
    >
      {icon}
    </button>
  );
  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-muted">
      {button(
        'Bold',
        <Bold size={14} />,
        () => editor.chain().focus().toggleBold().run(),
        active.bold
      )}
      {button(
        'Italic',
        <Italic size={14} />,
        () => editor.chain().focus().toggleItalic().run(),
        active.italic
      )}
      <div className="w-px h-5 mx-1 bg-border" />
      {button(
        'Heading 1',
        <Heading1 size={14} />,
        () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        active.h1
      )}
      {button(
        'Heading 2',
        <Heading2 size={14} />,
        () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        active.h2
      )}
      {button(
        'Heading 3',
        <Heading3 size={14} />,
        () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        active.h3
      )}
      <div className="w-px h-5 mx-1 bg-border" />
      {button(
        'Bullet list',
        <List size={14} />,
        () => editor.chain().focus().toggleBulletList().run(),
        active.bulletList
      )}
      {button(
        'Ordered list',
        <ListOrdered size={14} />,
        () => editor.chain().focus().toggleOrderedList().run(),
        active.orderedList
      )}
      <div className="w-px h-5 mx-1 bg-border" />
      {button(
        'Inline code',
        <Code size={14} />,
        () => editor.chain().focus().toggleCode().run(),
        active.code
      )}
      {button('Link', <Link size={14} />, addLink, active.link)}
      <div className="w-px h-5 mx-1 bg-border" />
      {button('Copy markdown', copied ? <Check size={14} /> : <Copy size={14} />, copyMarkdown)}
    </div>
  );
}
