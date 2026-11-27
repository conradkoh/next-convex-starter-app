// fallow-ignore-file unused-file
import type { CommonErrorCode } from '@workspace/shared/domain/errors';

/** Default user-facing copy per common code (frontend-owned). */
// fallow-ignore-next-line unused-export
export const COMMON_ERROR_COPY: Record<CommonErrorCode, string> = {
  NOT_AUTHENTICATED: 'Your session has expired. Please sign in again.',
  FORBIDDEN: "You don't have permission to do this.",
  NOT_FOUND: "We couldn't find what you were looking for.",
  INVALID_INPUT: "Some of the information provided isn't valid. Check it and try again.",
  CONFLICT: 'This changed since you loaded it. Refresh and try again.',
  FEATURE_DISABLED: "This feature isn't available right now.",
  INTERNAL_ERROR: 'Something went wrong on our side. Please try again.',
};
