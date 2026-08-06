'use client';

import '@mdxeditor/editor/style.css';

import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  tablePlugin,
  codeBlockPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  ListsToggle,
  BlockTypeSelect,
  CreateLink,
  InsertCodeBlock,
  InsertTable,
  InsertThematicBreak,
  type MDXEditorMethods,
  type MDXEditorProps,
} from '@mdxeditor/editor';
import { useTheme } from 'next-themes';
import type { ForwardedRef } from 'react';

import './markdown-editor-theme.css';

export default function InitializedMDXEditor({
  editorRef,
  ...props
}: { editorRef: ForwardedRef<MDXEditorMethods> | null } & MDXEditorProps) {
  const { resolvedTheme } = useTheme();

  return (
    <MDXEditor
      className={
        resolvedTheme === 'dark' ? 'dark-theme markdown-editor-theme' : 'markdown-editor-theme'
      }
      plugins={[
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        markdownShortcutPlugin(),
        linkPlugin(),
        tablePlugin(),
        codeBlockPlugin({ defaultCodeBlockLanguage: 'txt' }),
        toolbarPlugin({
          toolbarContents: () => (
            <>
              <UndoRedo />
              <BoldItalicUnderlineToggles />
              <ListsToggle />
              <BlockTypeSelect />
              <CreateLink />
              <InsertCodeBlock />
              <InsertTable />
              <InsertThematicBreak />
            </>
          ),
        }),
      ]}
      contentEditableClassName="prose dark:prose-invert max-w-none min-h-[200px] px-4 py-3"
      {...props}
      ref={editorRef}
    />
  );
}
