import { describe, expect, it } from 'vitest';

import { looksLikeHtml, normalizeMarkdownContent } from './normalizeMarkdownContent';

describe('normalizeMarkdownContent', () => {
  it('normalizes encoded HTML', () => {
    expect(looksLikeHtml('&amp;lt;p&amp;gt;Hello&amp;lt;/p&amp;gt;')).toBe(true);
    expect(
      normalizeMarkdownContent(
        '&amp;lt;p&amp;gt;Hello &amp;lt;strong&amp;gt;world&amp;lt;/strong&amp;gt;&amp;lt;/p&amp;gt;'
      )
    ).toContain('world');
  });

  it.each(['&amp;#x110000;', '&amp;#99999999999;'])(
    'returns %s unchanged without throwing',
    (input) => {
      expect(() => normalizeMarkdownContent(input)).not.toThrow();
      expect(normalizeMarkdownContent(input)).toBe(input);
    }
  );

  it.each([
    '```\n&amp; &lt; &gt;\n```',
    '~~~\n&amp;\n~~~',
    'Use `&amp;` and `&lt;` here',
    '# Title\n\n- a\n- b\n\n<div>x</div>',
    '    const x = 1\n    const y = 2',
  ])('keeps markdown byte-identical: %j', (input) => {
    expect(normalizeMarkdownContent(input)).toBe(input);
  });

  it('strips leading blank lines and trailing whitespace but keeps leading indentation', () => {
    expect(normalizeMarkdownContent('\n\n    code\n\n')).toBe('    code');
  });

  it('still converts a document that starts with an HTML tag', () => {
    expect(normalizeMarkdownContent('<div>x</div>')).toBe('x');
    const converted = normalizeMarkdownContent('<p>Hello <strong>world</strong></p>');
    expect(converted).toContain('Hello');
    expect(converted).toContain('**world**');
  });

  it('keeps the temporary nbsp empty-paragraph conversion outside code', () => {
    expect(normalizeMarkdownContent('a\n\n&nbsp;\n\nb')).toBe('a\n\n\u00A0\n\nb');
    expect(normalizeMarkdownContent('```\n&nbsp;\n```')).toBe('```\n&nbsp;\n```');
  });

  it.each([
    '```\n&amp; &lt;\n```',
    '# Title\n\n- a\n- b\n\n<div>x</div>',
    '    const x = 1\n    const y = 2',
    '<div>x</div>',
  ])('is idempotent: %j', (input) => {
    const once = normalizeMarkdownContent(input);
    expect(normalizeMarkdownContent(once)).toBe(once);
  });
});
