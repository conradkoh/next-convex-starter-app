import { ConvexError } from 'convex/values';
import { describe, expect, test } from 'vitest';

import { describeError, isAuthExpiredError, toClientError } from './clientError';

describe('toClientError', () => {
  test('classifies a coded ConvexError payload', () => {
    const error = new ConvexError({
      code: 'NOT_FOUND',
      message: 'Checklist not found',
      details: { resource: 'checklist' },
    });

    expect(toClientError(error)).toStrictEqual({
      kind: 'app',
      code: 'NOT_FOUND',
      rawCode: 'NOT_FOUND',
      message: 'Checklist not found',
      details: { resource: 'checklist' },
      referenceId: null,
    });
  });

  test('duck-types data instead of relying on instanceof', () => {
    const error = Object.assign(new Error('x'), {
      data: { code: 'FORBIDDEN', message: 'm' },
    });

    expect(toClientError(error).code).toBe('FORBIDDEN');
  });

  test('keeps unregistered codes out of the branchable code field', () => {
    const error = new ConvexError({ code: 'SOMETHING_NEW', message: 'Backend says' });
    const parsed = toClientError(error);

    expect(parsed.code).toBeNull();
    expect(parsed.rawCode).toBe('SOMETHING_NEW');
    expect(describeError(error, { fallback: 'F' }).message).toBe('Backend says');
  });

  test('accepts legacy string data', () => {
    const error = new ConvexError('Legacy message');
    const parsed = toClientError(error);

    expect(parsed.kind).toBe('app');
    expect(parsed.code).toBeNull();
    expect(describeError(error, { fallback: 'F' }).message).toBe('Legacy message');
  });

  test('extracts the Convex Request ID from a server error', () => {
    const error = new Error(
      '[CONVEX M(admin/invites:createInvite)] [Request ID: abc123] Server Error\n  Called by client'
    );
    const parsed = toClientError(error);

    expect(parsed.kind).toBe('unknown');
    expect(parsed.referenceId).toBe('abc123');
    expect(describeError(error, { fallback: 'Could not save.' })).toStrictEqual({
      message: 'Could not save.',
      code: null,
      referenceId: 'abc123',
    });
  });

  test('never surfaces a server error message as user copy', () => {
    const error = new Error('[CONVEX Q(x:y)] [Request ID: r2] Server Error');

    expect(describeError(error, { fallback: 'Could not load.' }).message).not.toContain(
      'Server Error'
    );
  });

  test('falls back to the Next.js digest for a reference id', () => {
    const error = Object.assign(new Error('boom'), { digest: 'd1g3st' });

    expect(toClientError(error).referenceId).toBe('d1g3st');
  });

  test('plain errors describe with the call-site fallback', () => {
    expect(describeError(new Error('secret internals'), { fallback: 'Try again.' }).message).toBe(
      'Try again.'
    );
  });

  test.each([
    ['a string', 'boom'],
    ['null', null],
    ['undefined', undefined],
    ['a number', 42],
  ])('classifies %s as an unknown error without throwing', (_name, thrown) => {
    const parsed = toClientError(thrown);

    expect(parsed.kind).toBe('unknown');
    expect(parsed.code).toBeNull();
    expect(describeError(thrown, { fallback: 'Try again.' }).message).toBe('Try again.');
  });

  test('regression: auth expiry is detected from data, not the message text', () => {
    const payload = { code: 'NOT_AUTHENTICATED', message: 'Not authenticated' };
    const error = Object.assign(
      new Error(`[CONVEX Q(auth:getState)] [Request ID: r1] ${JSON.stringify(payload)}`),
      { data: payload }
    );

    // The old AuthErrorBoundary matched `error.message` for "not authenticated"; the Convex
    // client only puts the JSON payload there, so that check never fired.
    expect(isAuthExpiredError(error)).toBe(true);
    expect(error.message.includes('not authenticated')).toBe(false);
  });
});

describe('describeError precedence', () => {
  test('call-site overrides win', () => {
    const error = new ConvexError({ code: 'FORBIDDEN', message: 'Backend copy' });

    expect(
      describeError(error, { fallback: 'F', overrides: { FORBIDDEN: 'Ask an admin.' } }).message
    ).toBe('Ask an admin.');
  });

  test('INTERNAL_ERROR ignores the backend message', () => {
    const error = new ConvexError({
      code: 'INTERNAL_ERROR',
      message: 'Failed to load updated invite',
    });

    expect(describeError(error, { fallback: 'Unused' }).message).toBe(
      'Something went wrong on our side. Please try again.'
    );
  });

  test('NOT_AUTHENTICATED ignores the backend message', () => {
    const error = new ConvexError({ code: 'NOT_AUTHENTICATED', message: 'Not authenticated' });

    expect(describeError(error, { fallback: 'Unused' }).message).toBe(
      'Your session has expired. Please sign in again.'
    );
  });

  test('other common codes prefer the backend message', () => {
    const error = new ConvexError({ code: 'NOT_FOUND', message: 'Checklist not found' });

    expect(describeError(error, { fallback: 'Unused' }).message).toBe('Checklist not found');
  });

  test('an empty backend message falls back to the common copy', () => {
    const error = new ConvexError({ code: 'CONFLICT', message: '' });

    expect(describeError(error, { fallback: 'Unused' }).message).toBe(
      'This changed since you loaded it. Refresh and try again.'
    );
  });

  test('domain codes without copy fall back to the call-site message', () => {
    const error = new ConvexError({ code: 'OAUTH_ERROR', message: '' });

    expect(describeError(error, { fallback: 'Could not connect.' }).message).toBe(
      'Could not connect.'
    );
  });
});
