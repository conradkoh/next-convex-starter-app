import {
  isCommonErrorCode,
  isErrorCode,
  isRawAppErrorPayload,
  type ErrorCode,
  type ErrorDetails,
} from '@workspace/shared/domain/errors';

import { COMMON_ERROR_COPY } from './commonCopy';

export type ClientErrorKind = 'app' | 'unknown';

export interface ClientError {
  /** 'app' = coded ConvexError payload (or legacy string data); 'unknown' = anything else. */
  kind: ClientErrorKind;
  /** Registered code, or null for unknown / unregistered / legacy. Branch only on this. */
  code: ErrorCode | null;
  /** The wire code as received (kept for logging; never branch on it). */
  rawCode: string | null;
  /** Backend user-safe message (app kind only). Never Error.message for unknown errors. */
  message: string | null;
  details: ErrorDetails;
  /** Convex Request ID or Next digest, for the "Reference:" line. */
  referenceId: string | null;
}

const REQUEST_ID_PATTERN = /\[Request ID: ([A-Za-z0-9]+)\]/;

function readProp(value: unknown, key: string): unknown {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)[key]
    : undefined;
}

// fallow-ignore-next-line complexity
function extractReferenceId(error: unknown): string | null {
  const message = readProp(error, 'message');
  if (typeof message === 'string') {
    const match = REQUEST_ID_PATTERN.exec(message);
    if (match) return match[1] ?? null;
  }
  const digest = readProp(error, 'digest');
  return typeof digest === 'string' && digest.length > 0 ? digest : null;
}

/** Classify any thrown value. Duck-types `error.data` (survives duplicate convex packages). Never throws. */
// fallow-ignore-next-line complexity
export function toClientError(error: unknown): ClientError {
  const referenceId = extractReferenceId(error);
  const data = readProp(error, 'data');
  if (isRawAppErrorPayload(data)) {
    return {
      kind: 'app',
      code: isErrorCode(data.code) ? data.code : null,
      rawCode: data.code,
      message: data.message,
      details: data.details ?? {},
      referenceId,
    };
  }
  if (typeof data === 'string' && data.length > 0) {
    return { kind: 'app', code: null, rawCode: null, message: data, details: {}, referenceId };
  }
  return {
    kind: 'unknown',
    code: null,
    rawCode: null,
    message: null,
    details: {},
    referenceId,
  };
}

/** True when the error is a coded NOT_AUTHENTICATED (session missing/expired). */
export function isAuthExpiredError(error: unknown): boolean {
  return toClientError(error).code === 'NOT_AUTHENTICATED';
}

export interface DescribeOptions {
  /** Shown for unknown errors and when nothing more specific applies. Follow the copy style rules. */
  fallback: string;
  /** Call-site copy per code; wins over everything. */
  overrides?: Partial<Record<ErrorCode, string>>;
}

export interface DescribedError {
  message: string;
  code: ErrorCode | null;
  referenceId: string | null;
}

/** Codes whose backend message is ignored in favour of common copy. */
const FORCE_COMMON_COPY: ReadonlySet<ErrorCode> = new Set(['INTERNAL_ERROR', 'NOT_AUTHENTICATED']);

/**
 * User-safe copy for any thrown value. Precedence:
 * 1. overrides[code]  2. common copy for INTERNAL_ERROR / NOT_AUTHENTICATED
 * 3. backend payload message  4. COMMON_ERROR_COPY[code]  5. fallback
 */
// fallow-ignore-next-line complexity
export function describeError(error: unknown, options: DescribeOptions): DescribedError {
  const parsed = toClientError(error);
  const { code, referenceId } = parsed;
  const override = code ? options.overrides?.[code] : undefined;
  if (override) return { message: override, code, referenceId };
  if (code && FORCE_COMMON_COPY.has(code) && isCommonErrorCode(code)) {
    return { message: COMMON_ERROR_COPY[code], code, referenceId };
  }
  if (parsed.kind === 'app' && parsed.message)
    return { message: parsed.message, code, referenceId };
  if (code && isCommonErrorCode(code))
    return { message: COMMON_ERROR_COPY[code], code, referenceId };
  return { message: options.fallback, code, referenceId };
}
