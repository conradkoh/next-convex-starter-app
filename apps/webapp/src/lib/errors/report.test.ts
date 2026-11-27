import { expect, test, vi } from 'vitest';

import { reportError, setErrorReporter } from './report';

test('delivers reports to the active reporter and restores the previous one', () => {
  const first = vi.fn();
  const restoreFirst = setErrorReporter(first);

  const second = vi.fn();
  const restoreSecond = setErrorReporter(second);

  const error = new Error('boom');
  reportError({ error, scope: 'x' });

  expect(second).toHaveBeenCalledTimes(1);
  expect(second).toHaveBeenCalledWith({ error, scope: 'x' });

  restoreSecond();
  reportError({ error, scope: 'y' });

  expect(first).toHaveBeenCalledTimes(1);
  expect(first).toHaveBeenCalledWith({ error, scope: 'y' });

  restoreFirst();
});

test('a throwing reporter never propagates', () => {
  const restore = setErrorReporter(() => {
    throw new Error('reporting failed');
  });

  expect(() => reportError({ error: new Error('boom'), scope: 'x' })).not.toThrow();

  restore();
});
