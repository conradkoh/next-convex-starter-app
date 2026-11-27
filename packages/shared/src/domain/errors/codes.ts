/**
 * Error code registry — the single source of truth for codes carried in `ConvexError.data.code`.
 *
 * Rules (see docs/developer/error-handling.md):
 * - SCREAMING_SNAKE_CASE, named for the condition (not HTTP status, not UI).
 * - Wire contract: additive only. Never rename or reuse a code. To retire one, migrate all
 *   throwers and keep it here (marked deprecated) for one release.
 * - Common codes have default frontend copy and recovery. Add a domain code
 *   (`<DOMAIN>_<CONDITION>`) only when the UI must treat the cause differently; otherwise use a
 *   common code plus `details.reason` / `details.resource`.
 */
export const COMMON_ERROR_CODES = [
  'NOT_AUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'INVALID_INPUT',
  'CONFLICT',
  'FEATURE_DISABLED',
  'INTERNAL_ERROR',
] as const;

export const DOMAIN_ERROR_CODES = [
  'SIGNUP_DISABLED',
  'EMAIL_ALREADY_EXISTS',
  'INVITE_INVALID',
  'INVITE_EMAIL_MISMATCH',
  'GOOGLE_ACCOUNT_IN_USE',
  'ALREADY_CONNECTED',
  'NO_GOOGLE_ACCOUNT',
  'UNSAFE_DISCONNECT',
  'OAUTH_ERROR',
  'USER_TYPE_MISMATCH',
  'INVALID_USER_TYPE',
  'INVALID_CONVERSION',
] as const;

export const ERROR_CODES = [...COMMON_ERROR_CODES, ...DOMAIN_ERROR_CODES] as const;

export type CommonErrorCode = (typeof COMMON_ERROR_CODES)[number];
export type DomainErrorCode = (typeof DOMAIN_ERROR_CODES)[number];
export type ErrorCode = (typeof ERROR_CODES)[number];

const ERROR_CODE_SET: ReadonlySet<string> = new Set(ERROR_CODES);
const COMMON_ERROR_CODE_SET: ReadonlySet<string> = new Set(COMMON_ERROR_CODES);

/** True when `value` is a registered error code. */
export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && ERROR_CODE_SET.has(value);
}

/** True when `code` is in the common tier (frontend has default copy for it). */
export function isCommonErrorCode(code: ErrorCode): code is CommonErrorCode {
  return COMMON_ERROR_CODE_SET.has(code);
}
