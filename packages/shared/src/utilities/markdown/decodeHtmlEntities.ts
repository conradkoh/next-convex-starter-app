const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00A0',
};

function fromCodePointOr(codePoint: number, fallback: string) {
  return Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
    ? String.fromCodePoint(codePoint)
    : fallback;
}

export function decodeHtmlEntities(input: string, maxPasses = 3): string {
  let result = input;
  for (let pass = 0; pass < maxPasses; pass++) {
    const previous = result;
    result = result.replace(
      /&(?:amp;)?(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g,
      (match, body: string) => {
        if (body.startsWith('#x') || body.startsWith('#X'))
          return fromCodePointOr(parseInt(body.slice(2), 16), match);
        if (body.startsWith('#')) return fromCodePointOr(parseInt(body.slice(1), 10), match);
        return NAMED_ENTITIES[body] ?? match;
      }
    );
    if (result === previous) break;
  }
  return result;
}
