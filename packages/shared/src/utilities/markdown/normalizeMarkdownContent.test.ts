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

  it('keeps entity-encoded legacy HTML as literal text', () => {
    expect(normalizeMarkdownContent('&lt;p&gt;Hello&lt;/p&gt;')).toBe('&lt;p&gt;Hello&lt;/p&gt;');
  });

  it('leaves a document with a raw tag and a fenced block unconverted', () => {
    const markdown = '<div>x</div>\n\n```\ncode\n```';
    expect(normalizeMarkdownContent(markdown)).toBe(markdown);
  });

  it('converts a raw tag indented by up to three spaces', () => {
    expect(normalizeMarkdownContent('  <p>x</p>')).toBe('x');
  });

  it('leaves a raw tag indented by four spaces as an indented code block', () => {
    expect(normalizeMarkdownContent('    <p>x</p>')).toBe('    <p>x</p>');
  });

  it('leaves the &nbsp; empty-paragraph sentinel as written, outside and inside code', () => {
    expect(normalizeMarkdownContent('a\n\n&nbsp;\n\nb')).toBe('a\n\n&nbsp;\n\nb');
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
