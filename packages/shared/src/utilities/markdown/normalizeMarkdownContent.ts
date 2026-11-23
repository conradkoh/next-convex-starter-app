import TurndownService from 'turndown';

import { decodeHtmlEntities } from './decodeHtmlEntities';

const LEGACY_HTML_TAG_PATTERN =
  /<\/?(?:p|div|span|strong|em|b|i|a|br|h[1-6]|ul|ol|li|table|tr|td|th|blockquote|pre|code)\b[^>]*>/i;
// A document is legacy HTML only if it starts with a raw tag, not with markdown. Up to three leading
// spaces are allowed: four or more is an indented code block, which must not be read as HTML.
const HTML_DOCUMENT_START = /^<[a-zA-Z/!]/;
const LEADING_BLOCK_INDENT = /^ {0,3}/;
// Fenced (``` and ~~~) and inline code spans; reused to skip code. No /g flag on tests.
const CODE_PATTERN = /```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`/g;

export function containsFencedCode(text: string) {
  return /```[\s\S]*?```|~~~[\s\S]*?~~~/.test(text);
}

export function looksLikeHtml(text: string) {
  const decoded = decodeHtmlEntities(text.trim());
  return !!decoded && !containsFencedCode(decoded) && LEGACY_HTML_TAG_PATTERN.test(decoded);
}

export function stripHtmlTags(html: string) {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
let turndown: TurndownService | undefined;
function getTurndown() {
  return (turndown ??= new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' }));
}
export function htmlToMarkdown(html: string) {
  try {
    const markdown = getTurndown().turndown(html).trim();
    return markdown || stripHtmlTags(html);
  } catch {
    return stripHtmlTags(html);
  }
}

function isLegacyHtmlDocument(value: string) {
  // Any fenced block leaves the whole document alone, so code inside it is never converted.
  return (
    !containsFencedCode(value) &&
    HTML_DOCUMENT_START.test(value.replace(LEADING_BLOCK_INDENT, '')) &&
    LEGACY_HTML_TAG_PATTERN.test(value.replace(CODE_PATTERN, ''))
  );
}

export function normalizeMarkdownContent(input: string) {
  // Strip leading blank lines and trailing whitespace only: leading indentation of the first line is kept.
  const value = input.replace(/^(?:[ \t]*\r?\n)+/, '').trimEnd();
  if (!value) return '';
  if (isLegacyHtmlDocument(value)) return htmlToMarkdown(value);
  return value;
}
