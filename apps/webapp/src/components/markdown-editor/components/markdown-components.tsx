import type { ReactNode } from 'react';
import type { Components } from 'react-markdown';

import { isEmptyParagraphChildren } from '../utils/emptyParagraph';

interface HeadingProps {
  children?: ReactNode;
}

interface ContentProps {
  children?: ReactNode;
}

interface AnchorProps {
  href?: string;
  children?: ReactNode;
}

interface CodeProps {
  children?: ReactNode;
  className?: string;
}

export const markdownComponents: Components = {
  h1: ({ children }: HeadingProps) => (
    <h1 className="scroll-m-20 text-3xl font-semibold tracking-tight text-foreground mb-4 mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }: HeadingProps) => (
    <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight text-foreground mb-4 mt-8 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }: HeadingProps) => (
    <h3 className="scroll-m-20 text-xl font-semibold tracking-tight text-foreground mb-3 mt-6 first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }: HeadingProps) => (
    <h4 className="scroll-m-20 text-lg font-semibold tracking-tight text-foreground mb-3 mt-5 first:mt-0">
      {children}
    </h4>
  ),
  h5: ({ children }: HeadingProps) => (
    <h5 className="scroll-m-20 text-base font-semibold tracking-tight text-foreground mb-2 mt-4">
      {children}
    </h5>
  ),
  h6: ({ children }: HeadingProps) => (
    <h6 className="scroll-m-20 text-sm font-semibold tracking-tight text-foreground mb-2 mt-4">
      {children}
    </h6>
  ),
  p: ({ children }: ContentProps) =>
    isEmptyParagraphChildren(children) ? (
      <p className="leading-7 text-foreground mb-4 min-h-[1.5em]" aria-hidden="true">
        {'\u00A0'}
      </p>
    ) : (
      <p className="leading-7 text-foreground mb-4">{children}</p>
    ),
  ul: ({ children }: ContentProps) => (
    <ul className="list-disc pl-6 mb-4 mt-0 space-y-1 text-foreground">{children}</ul>
  ),
  ol: ({ children }: ContentProps) => (
    <ol className="list-decimal pl-6 mb-4 mt-0 space-y-1 text-foreground">{children}</ol>
  ),
  li: ({ children }: ContentProps) => (
    <li className="text-foreground leading-7 [&>p]:my-0 [&>p+p]:mt-2 [&>ul]:mt-1 [&>ul]:mb-0 [&>ol]:mt-1 [&>ol]:mb-0">
      {children}
    </li>
  ),
  blockquote: ({ children }: ContentProps) => (
    <blockquote className="border-l-4 border-border my-4 bg-muted/30 rounded-md px-5 py-3 text-muted-foreground/80 [&>p]:mb-0 [&>p]:text-muted-foreground/80">
      {children}
    </blockquote>
  ),
  code: ({ children, className }: CodeProps) => {
    const isFenced = typeof className === 'string' && className.includes('language-');
    if (isFenced) {
      return (
        <code className={[className, 'font-mono [font-size:inherit]'].filter(Boolean).join(' ')}>
          {children}
        </code>
      );
    }
    return (
      <code className="relative rounded bg-muted px-1.5 py-0.5 font-mono text-[0.875em] text-foreground border border-border/50">
        {children}
      </code>
    );
  },
  // A fence with no language renders its child `code` without a language marker class, so it takes
  // the inline branch above. Neutralise that chip by position here so every fenced block is
  // 14px/22px on the muted surface, with or without a language.
  pre: ({ children }: ContentProps) => (
    <pre className="my-4 overflow-x-auto rounded-md border border-border bg-muted p-4 text-[0.875rem]/[1.375rem] [&_code]:rounded-none [&_code]:border-0 [&_code]:bg-transparent [&_code]:p-0 [&_code]:[font-size:inherit]">
      {children}
    </pre>
  ),
  a: ({ href, children }: AnchorProps) => (
    <a
      href={href}
      className="text-primary hover:text-primary/80 underline underline-offset-2 decoration-1 hover:decoration-2 transition-all"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-8 border-0 border-t border-border" />,
  table: ({ children }: ContentProps) => (
    <div className="my-4 overflow-x-auto rounded-md border border-border">
      <table className="w-full border-collapse text-[0.875rem]">{children}</table>
    </div>
  ),
  thead: ({ children }: ContentProps) => <thead className="bg-muted/50">{children}</thead>,
  tbody: ({ children }: ContentProps) => <tbody>{children}</tbody>,
  tr: ({ children }: ContentProps) => (
    <tr className="border-b border-border last:border-b-0">{children}</tr>
  ),
  th: ({ children }: ContentProps) => (
    <th className="px-4 py-3 text-left font-semibold text-foreground bg-muted/30 border-r border-border last:border-r-0">
      {children}
    </th>
  ),
  td: ({ children }: ContentProps) => (
    <td className="px-4 py-3 text-foreground border-r border-border last:border-r-0">{children}</td>
  ),
  strong: ({ children }: ContentProps) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }: ContentProps) => <em className="italic text-foreground">{children}</em>,
};
