import tsParser from '@typescript-eslint/parser';
import { describe, expect, it } from 'bun:test';
import { Linter, RuleTester } from 'eslint';

import noRawConvexError from './no-raw-convex-error.mjs';

RuleTester.describe = describe;
RuleTester.it = it;

const BACKEND_FILE = 'services/backend/convex/checklists.ts';
const err = { messageId: 'noRawConvexError' };

const ruleTester = new RuleTester({
  languageOptions: { parser: tsParser, ecmaVersion: 'latest', sourceType: 'module' },
});

ruleTester.run('no-raw-convex-error', noRawConvexError, {
  valid: [
    {
      code: "throw appError('NOT_FOUND', 'Checklist not found', { resource: 'checklist' });",
      filename: BACKEND_FILE,
    },
    {
      code: "import { ConvexError } from 'convex/values';\nif (e instanceof ConvexError) {}",
      filename: BACKEND_FILE,
    },
    { code: 'type E = ConvexError<{ code: string }>;', filename: BACKEND_FILE },
    { code: "const x = new Error('invariant');", filename: BACKEND_FILE },
  ],
  invalid: [
    {
      code: "throw new ConvexError({ code: 'NOT_FOUND', message: 'x' });",
      filename: BACKEND_FILE,
      errors: [err],
    },
    {
      code: "const e = new ConvexError('legacy');",
      filename: BACKEND_FILE,
      errors: [err],
    },
  ],
});

describe('no-raw-convex-error end-to-end through flat config', () => {
  it('reports a raw ConvexError under the local/no-raw-convex-error rule id with the doc path', () => {
    const linter = new Linter({ configType: 'flat' });
    const messages = linter.verify(
      "throw new ConvexError({ code: 'NOT_FOUND', message: 'x' });",
      [
        {
          files: ['**/*.ts'],
          languageOptions: { parser: tsParser, sourceType: 'module' },
          plugins: { local: { rules: { 'no-raw-convex-error': noRawConvexError } } },
          rules: { 'local/no-raw-convex-error': 'error' },
        },
      ],
      BACKEND_FILE
    );
    expect(messages).toHaveLength(1);
    expect(messages[0].ruleId).toBe('local/no-raw-convex-error');
    expect(messages[0].message).toContain('docs/developer/error-handling.md');
  });
});
