import { describe, expect, test } from 'vitest';

import { isRawAppErrorPayload } from './payload';

describe('isRawAppErrorPayload', () => {
  test('accepts a coded payload with details', () => {
    expect(
      isRawAppErrorPayload({ code: 'NOT_FOUND', message: 'x', details: { resource: 'checklist' } })
    ).toBe(true);
  });

  test('accepts a payload without details', () => {
    expect(isRawAppErrorPayload({ code: 'NOT_FOUND', message: 'x' })).toBe(true);
  });

  test('accepts an unregistered string code from another backend build', () => {
    expect(isRawAppErrorPayload({ code: 'SOMETHING_NEW', message: 'x' })).toBe(true);
  });

  test.each([
    ['a string', 'string'],
    ['null', null],
    ['an array', []],
    ['a payload without a message', { code: 'NOT_FOUND' }],
    ['nested details', { code: 'NOT_FOUND', message: 'x', details: { a: { b: 1 } } }],
    ['undefined detail values', { code: 'NOT_FOUND', message: 'x', details: { a: undefined } }],
    ['a reserved detail key', { code: 'NOT_FOUND', message: 'x', details: { $a: 'x' } }],
    ['an empty detail key', { code: 'NOT_FOUND', message: 'x', details: { '': 'x' } }],
    ['a numeric array detail', { code: 'NOT_FOUND', message: 'x', details: { a: [1] } }],
  ])('rejects %s', (_name, value) => {
    expect(isRawAppErrorPayload(value)).toBe(false);
  });

  test('rejects an explicit undefined details key', () => {
    expect(isRawAppErrorPayload({ code: 'NOT_FOUND', message: 'x', details: undefined })).toBe(
      false
    );
  });
});
