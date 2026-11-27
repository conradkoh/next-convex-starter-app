import { describe, expect, test } from 'vitest';

import {
  COMMON_ERROR_CODES,
  DOMAIN_ERROR_CODES,
  ERROR_CODES,
  isCommonErrorCode,
  isErrorCode,
} from './codes';

describe('error codes', () => {
  test('every code is SCREAMING_SNAKE_CASE', () => {
    for (const code of ERROR_CODES) {
      expect(code).toMatch(/^[A-Z][A-Z0-9_]*$/);
    }
  });

  test('codes are unique', () => {
    expect(new Set(ERROR_CODES).size).toBe(ERROR_CODES.length);
  });

  test('the common and domain tiers do not overlap', () => {
    const common = new Set<string>(COMMON_ERROR_CODES);
    const overlap = DOMAIN_ERROR_CODES.filter((code) => common.has(code));
    expect(overlap).toEqual([]);
  });

  test('isErrorCode accepts registered codes only', () => {
    expect(isErrorCode('NOT_FOUND')).toBe(true);
    expect(isErrorCode('BOGUS')).toBe(false);
    expect(isErrorCode(1)).toBe(false);
  });

  test('isCommonErrorCode distinguishes the common tier', () => {
    expect(isCommonErrorCode('FORBIDDEN')).toBe(true);
    expect(isCommonErrorCode('OAUTH_ERROR')).toBe(false);
  });
});
