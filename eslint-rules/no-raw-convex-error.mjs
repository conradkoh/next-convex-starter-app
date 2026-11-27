const DOC = 'docs/developer/error-handling.md';

/**
 * Backend errors must go through appError() so every thrown failure carries the shared
 * { code, message, details? } contract. See docs/developer/error-handling.md.
 */
/** @type {import('eslint').Rule.RuleModule} */
const noRawConvexError = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Backend errors must be thrown through appError() so they follow the shared {code,message,details} contract.',
    },
    schema: [],
    messages: {
      noRawConvexError:
        "Do not construct ConvexError directly. Use `throw appError(code, message, details?)` from 'services/backend/modules/errors/appError' (see " +
        DOC +
        ').',
    },
  },
  create(context) {
    return {
      NewExpression(node) {
        if (node.callee.type === 'Identifier' && node.callee.name === 'ConvexError') {
          context.report({ node, messageId: 'noRawConvexError' });
        }
      },
    };
  },
};

export default noRawConvexError;
