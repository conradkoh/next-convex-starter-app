import type { MDXComponents } from 'mdx/types';
import type { ReactNode } from 'react';

/**
 * Props for heading components.
 */
interface HeadingProps {
  children: ReactNode;
}

/**
 * Props for paragraph and list components.
 */
interface ContentProps {
  children: ReactNode;
}

/**
 * Props for anchor components.
 */
interface AnchorProps {
  href?: string;
  children: ReactNode;
}

/**
 * Props for code components (inline and fenced blocks)
 */
interface CodeProps {
  children: ReactNode;
  className?: string;
}

/**
 * Provides GitHub-style MDX components with clean, modern styling and semantic colors.
 * Follows GitHub's markdown rendering conventions for consistent, professional appearance.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Headings with GitHub-style hierarchy and spacing
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
    // Clean paragraph styling with GitHub-like spacing
    p: ({ children }: ContentProps) => <p className="leading-7 text-foreground mb-4">{children}</p>,
    // GitHub-style lists with proper spacing
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
    // Clean blockquote with lighter gray text (GitHub-style)
    blockquote: ({ children }: ContentProps) => (
      <blockquote className="border-l-4 border-border my-6 bg-muted/30 rounded-md px-5 py-3 text-muted-foreground/80 [&>p]:mb-0 [&>p]:text-muted-foreground/80">
        {children}
      </blockquote>
    ),
    // Code styling: differentiate inline vs fenced blocks via className (language-*)
    code: ({ children, className }: CodeProps) => {
      const isFenced = typeof className === 'string' && className.includes('language-');
      if (isFenced) {
        // Let the parent <pre> own the background; keep code transparent
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
    // Improved code blocks with matching background
    pre: ({ children }: ContentProps) => (
      <pre className="my-4 overflow-x-auto rounded-md border border-border bg-muted p-4 text-[0.875rem]/[1.375rem] [&_code]:rounded-none [&_code]:border-0 [&_code]:bg-transparent [&_code]:p-0 [&_code]:[font-size:inherit]">
        {children}
      </pre>
    ),
    // GitHub-style links with subtle hover effect
    a: ({ href, children }: AnchorProps) => (
      <a
        href={href}
        className="text-primary hover:text-primary/80 underline underline-offset-2 decoration-1 hover:decoration-2 transition-all"
      >
        {children}
      </a>
    ),
    // Horizontal rule with GitHub styling
    hr: () => <hr className="my-8 border-0 border-t border-border" />,
    // Table styling (GitHub-style) - Fixed rendering
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
      <td className="px-4 py-3 text-foreground border-r border-border last:border-r-0">
        {children}
      </td>
    ),
    // Strong and emphasis with subtle styling
    strong: ({ children }: ContentProps) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }: ContentProps) => <em className="italic text-foreground">{children}</em>,
    ...components,
  };
}
