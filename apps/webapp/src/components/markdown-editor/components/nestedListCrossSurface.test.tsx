import { render } from '@testing-library/react';
import { Editor } from '@tiptap/core';
import { normalizeMarkdownContent } from '@workspace/shared/utilities/markdown';
import { describe, expect, it } from 'vitest';

import { MarkdownViewer } from './MarkdownViewer';
import { createMarkdownEditorExtensions } from '../extensions/markdownEditorExtensions';

function saveThroughEditor(markdown: string) {
  const editor = new Editor({
    extensions: createMarkdownEditorExtensions(),
    content: normalizeMarkdownContent(markdown),
    contentType: 'markdown',
  });
  try {
    return editor.getMarkdown();
  } finally {
    editor.destroy();
  }
}

// Text that belongs to this item rather than to its nested lists. react-markdown renders a tight
// list item's inline content as a bare text node, so `textContent` would include nested items.
function ownText(item: Element): string {
  const paragraph = item.querySelector(':scope > p');
  if (paragraph) {
    return (paragraph.textContent ?? '').trim();
  }
  return Array.from(item.childNodes)
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent ?? '')
    .join('')
    .trim();
}

function findItem(container: HTMLElement, label: string): HTMLLIElement {
  const match = Array.from(container.querySelectorAll('li')).find(
    (item) => ownText(item) === label
  );
  if (!match) {
    throw new Error(`No list item labelled "${label}"`);
  }
  return match;
}

function directItems(list: Element): string[] {
  return Array.from(list.querySelectorAll(':scope > li')).map(ownText);
}

function renderSaved(markdown: string) {
  const saved = saveThroughEditor(markdown);
  expect(saved).toBe(markdown);
  const { container } = render(<MarkdownViewer markdown={saved} />);
  return container;
}

describe('nested list across editor and viewer', () => {
  it('keeps 3-wide ordered-parent children inside the parent item', () => {
    const container = renderSaved('1. one\n   - nested\n   - nested two\n2. two');

    const orderedList = container.querySelector('ol');
    expect(orderedList).not.toBeNull();
    expect(directItems(orderedList as Element)).toEqual(['one', 'two']);

    const one = findItem(container, 'one');
    const nestedList = one.querySelector(':scope > ul');
    expect(nestedList).not.toBeNull();
    expect(directItems(nestedList as Element)).toEqual(['nested', 'nested two']);

    const two = findItem(container, 'two');
    expect(two.querySelector(':scope > ul')).toBeNull();
    expect(two.querySelector(':scope > ol')).toBeNull();
  });

  it('keeps 4-wide ordered-parent children inside the parent item', () => {
    const container = renderSaved('10. ten\n    - nested\n    - nested two\n11. eleven');

    const orderedList = container.querySelector('ol');
    expect(orderedList).not.toBeNull();
    expect(directItems(orderedList as Element)).toEqual(['ten', 'eleven']);

    const ten = findItem(container, 'ten');
    const nestedList = ten.querySelector(':scope > ul');
    expect(nestedList).not.toBeNull();
    expect(directItems(nestedList as Element)).toEqual(['nested', 'nested two']);
  });

  it('keeps bullet-parent children inside the parent item', () => {
    const container = renderSaved('- a\n  - b\n  - c\n- d');

    const bulletList = container.querySelector('ul');
    expect(bulletList).not.toBeNull();
    expect(directItems(bulletList as Element)).toEqual(['a', 'd']);

    const a = findItem(container, 'a');
    const nestedList = a.querySelector(':scope > ul');
    expect(nestedList).not.toBeNull();
    expect(directItems(nestedList as Element)).toEqual(['b', 'c']);
  });

  it('keeps a deep nested item nested and its sibling a sibling', () => {
    const container = renderSaved('1. one\n   - nested\n     - deep\n   - sib\n2. two');

    const one = findItem(container, 'one');
    const nestedList = one.querySelector(':scope > ul');
    expect(nestedList).not.toBeNull();

    const nested = findItem(container, 'nested');
    expect(nested.parentElement).toBe(nestedList);

    const deepList = nested.querySelector(':scope > ul');
    expect(deepList).not.toBeNull();
    expect(directItems(deepList as Element)).toEqual(['deep']);

    const sib = findItem(container, 'sib');
    expect(sib.parentElement).toBe(nestedList);
    expect(sib.querySelector(':scope > ul')).toBeNull();
  });

  it('keeps editor-saved nested markdown stable when it is saved again', () => {
    const container = renderSaved('1. one\n   - nested\n   - nested two\n2. two');

    // The end-to-end loop: the viewer received exactly what the editor saved, the editor saved it
    // byte-identically on the previous pass, and the `one` item renders its nested list.
    const one = findItem(container, 'one');
    expect(one.querySelector(':scope > ul')).not.toBeNull();
    expect(saveThroughEditor('1. one\n   - nested\n   - nested two\n2. two')).toBe(
      '1. one\n   - nested\n   - nested two\n2. two'
    );
  });
});
