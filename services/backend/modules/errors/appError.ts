import {
  isValidErrorDetails,
  type AppErrorPayload,
  type ErrorCode,
  type ErrorDetails,
} from '@workspace/shared/domain/errors';
import { ConvexError } from 'convex/values';

/**
 * The single way to raise an expected, user-recoverable failure from a Convex function.
 *
 * `throw appError('NOT_FOUND', 'Checklist not found', { resource: 'checklist' })`
 *
 * - `message`: static, user-safe sentence. Never interpolate user input, ids, emails,
 *   tokens or permission keys — put machine-readable context in `details`.
 * - Use plain `throw new Error()` only for invariants / unexpected faults.
 * See docs/developer/error-handling.md.
 */
// fallow-ignore-next-line complexity
export function appError(
  code: ErrorCode,
  message: string,
  details?: ErrorDetails
): ConvexError<AppErrorPayload> {
  if (message.length === 0) {
    throw new TypeError(`appError(${code}): message must be a non-empty string`);
  }
  if (details !== undefined && !isValidErrorDetails(details)) {
    throw new TypeError(
      `appError(${code}): details must be a flat map of string/number/boolean/null/string[]`
    );
  }
  const payload: AppErrorPayload =
    details === undefined ? { code, message } : { code, message, details };
  return new ConvexError(payload);
}
