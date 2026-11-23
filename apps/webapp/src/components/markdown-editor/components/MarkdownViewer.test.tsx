import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MarkdownViewer } from './MarkdownViewer';

const sampleMarkdown = `# Heading One

## Heading Two

- List item one
- List item two

Visit [example link](https://example.com) for more.

Inline \`code\` and fenced block:

\`\`\`js
const greeting = 'hello';
\`\`\`

| Col A | Col B |
| ----- | ----- |
| A1    | B1    |
`;

describe('MarkdownViewer', () => {
  it('renders headings from markdown', () => {
    render(<MarkdownViewer markdown={sampleMarkdown} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Heading One' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Heading Two' })).toBeInTheDocument();
  });

  it('renders lists and links', () => {
    render(<MarkdownViewer markdown={sampleMarkdown} />);
    expect(screen.getByText('List item one')).toBeInTheDocument();
    expect(screen.getByText('List item two')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'example link' })).toHaveAttribute(
      'href',
      'https://example.com'
    );
  });

  it('renders inline and fenced code', () => {
    render(<MarkdownViewer markdown={sampleMarkdown} />);
    expect(screen.getByText('code')).toBeInTheDocument();
    expect(screen.getByText("const greeting = 'hello';")).toBeInTheDocument();
  });

  it('renders table cells', () => {
    render(<MarkdownViewer markdown={sampleMarkdown} />);
    expect(screen.getByText('Col A')).toBeInTheDocument();
    expect(screen.getByText('A1')).toBeInTheDocument();
    expect(screen.getByText('B1')).toBeInTheDocument();
  });

  it('renders blank lines from nbsp empty paragraphs', () => {
    const { container } = render(
      <MarkdownViewer markdown={'This is some content\n\n&amp;nbsp;\n\nabc'} />
    );
    expect(container.querySelectorAll('p').length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText('This is some content')).toBeInTheDocument();
    expect(screen.getByText('abc')).toBeInTheDocument();
  });

  it('renders escaped block-start paragraph text without backslashes', () => {
    const { container } = render(
      <MarkdownViewer markdown={'\\---\n\n1\\. not a list\n\n\\# not a heading'} />
    );
    expect(container.textContent).not.toContain('\\');
    expect(screen.getByText('1. not a list')).toBeInTheDocument();
    expect(screen.getByText('# not a heading')).toBeInTheDocument();
  });
});

describe('ordered list start', () => {
  it.each([
    ['10. ten\n11. eleven', '10'],
    ['3. three\n4. four', '3'],
  ])('renders %j as <ol start="%s">', (markdown, start) => {
    const { container } = render(<MarkdownViewer markdown={markdown} />);
    expect(container.querySelector('ol')?.getAttribute('start')).toBe(start);
  });

  it('renders a list starting at 1 with an effective start of 1', () => {
    const { container } = render(<MarkdownViewer markdown={'1. one\n2. two'} />);
    expect(container.querySelector('ol')?.getAttribute('start') ?? '1').toBe('1');
  });
});
