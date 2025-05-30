import type { Result } from '../../common/types/Result';

export type AuthError =
  | 'session_not_found'
  | 'user_not_found'
  | 'unauthorized'
  | 'chat_not_found'
  | 'message_not_found';

// Helper function for auth-specific errors
export const authError = (error: AuthError): Result<never, AuthError> => ({
  success: false,
  error,
});
