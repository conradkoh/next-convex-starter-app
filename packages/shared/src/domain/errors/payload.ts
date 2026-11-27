import type { ErrorCode } from './codes';

/** Allowed value types inside `details` (flat; JSON- and Convex-Value-safe). */
export type DetailValue = string | number | boolean | null | string[];
/**
 * Machine-readable, non-sensitive context. Flat map. Reserved keys:
 * field, fields, reason, resource, limit, retryAfterMs, flow, permission.
 * Never PII, secrets, session ids, other users' document ids or diagnostics.
 */
export type ErrorDetails = Record<string, DetailValue>;

/** The entire `ConvexError.data` produced by the backend. */
export type AppErrorPayload = {
  code: ErrorCode;
  /** Static, user-safe English sentence. */
  message: string;
  details?: ErrorDetails;
};

/** A valid payload shape whose code may not be in this build's registry (older/newer backend). */
export interface RawAppErrorPayload {
  code: string;
  message: string;
  details?: ErrorDetails;
}

// fallow-ignore-next-line complexity
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

// fallow-ignore-next-line complexity
function isDetailValue(value: unknown): value is DetailValue {
  if (value === null) return true;
  if (typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/** Flat plain object; keys 1..1024 chars not starting with '$'; values are DetailValue (no undefined). */
export function isValidErrorDetails(details: unknown): details is ErrorDetails {
  if (!isPlainObject(details)) return false;
  return Object.entries(details).every(
    ([key, value]) =>
      key.length > 0 && key.length <= 1024 && !key.startsWith('$') && isDetailValue(value)
  );
}

/** Object with string `code`, string `message`, and `details` absent or valid. */
// fallow-ignore-next-line complexity
export function isRawAppErrorPayload(data: unknown): data is RawAppErrorPayload {
  if (!isPlainObject(data)) return false;
  if (typeof data.code !== 'string' || typeof data.message !== 'string') return false;
  return !('details' in data) || isValidErrorDetails(data.details);
}
