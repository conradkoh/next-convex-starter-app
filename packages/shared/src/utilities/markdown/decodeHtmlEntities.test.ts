import { describe, expect, it } from 'vitest';

import { decodeHtmlEntities } from './decodeHtmlEntities';

describe('decodeHtmlEntities', () => {
  it('decodes entities repeatedly', () => {
    expect(decodeHtmlEntities('&amp;lt;p&amp;gt;')).toBe('<p>');
    expect(decodeHtmlEntities('&amp;amp;amp;nbsp;')).toBe('\u00a0');
  });

  it('leaves out-of-range numeric entities unchanged without throwing', () => {
    expect(() => decodeHtmlEntities('&#x110000;')).not.toThrow();
    expect(decodeHtmlEntities('&#x110000;')).toBe('&#x110000;');
    expect(decodeHtmlEntities('&#99999999999;')).toBe('&#99999999999;');
  });
});
