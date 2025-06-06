import type { AuthError } from '../../auth/types/AuthError';
import type { Result } from '../../common/types/Result';

export type ChatResult<T> = Result<T, AuthError>;
