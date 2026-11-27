import type { ErrorDetails } from '@workspace/shared/domain/errors';
import { ConvexError } from 'convex/values';
import { describe, expect, test } from 'vitest';

import { appError } from './appError';

describe('appError', () => {
  test('produces a ConvexError carrying the coded payload', () => {
    const error = appError('NOT_FOUND', 'Checklist not found', { resource: 'checklist' });

    expect(error).toBeInstanceOf(ConvexError);
    expect(error.data).toStrictEqual({
      code: 'NOT_FOUND',
      message: 'Checklist not found',
      details: { resource: 'checklist' },
    });
  });

  test('omits the details key when no details are supplied', () => {
    const error = appError('NOT_AUTHENTICATED', 'Not authenticated');

    expect('details' in error.data).toBe(false);
    expect(error.data).toStrictEqual({
      code: 'NOT_AUTHENTICATED',
      message: 'Not authenticated',
    });
  });

  test('payload survives a JSON round trip', () => {
    const error = appError('FORBIDDEN', 'You do not have permission to perform this action', {
      permission: 'invites:manage',
    });

    expect(JSON.parse(JSON.stringify(error.data))).toStrictEqual(error.data);
  });

  test('rejects nested details at author time', () => {
    expect(() => appError('NOT_FOUND', 'x', { a: { b: 1 } } as unknown as ErrorDetails)).toThrow(
      TypeError
    );
  });

  test('rejects undefined detail values at author time', () => {
    expect(() => appError('NOT_FOUND', 'x', { a: undefined } as unknown as ErrorDetails)).toThrow(
      TypeError
    );
  });

  test('rejects an empty message at author time', () => {
    expect(() => appError('NOT_FOUND', '')).toThrow(TypeError);
  });

  test('rejects unknown codes at compile time', () => {
    // @ts-expect-error unknown code is a compile error
    expect(appError('BOGUS', 'x').data.code).toBe('BOGUS');
  });
});
