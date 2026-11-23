import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useMDXComponents } from './mdx-components';

function OrderedListWithStart({ start }: { start: number }) {
  const { ol: OrderedList } = useMDXComponents({});
  if (typeof OrderedList !== 'function') {
    throw new Error('MDX ol component is not renderable');
  }
  return (
    <OrderedList start={start}>
      <li>first</li>
      <li>second</li>
    </OrderedList>
  );
}

describe('MDX ordered list start', () => {
  it.each([
    [10, '10'],
    [3, '3'],
    [1, '1'],
  ])('renders start %i as <ol start="%s">', (start, expected) => {
    const { container } = render(<OrderedListWithStart start={start} />);
    expect(container.querySelector('ol')?.getAttribute('start')).toBe(expected);
  });
});
