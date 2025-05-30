export type Result<T, E = string> = { success: true; data: T } | { success: false; error: E };

// Helper functions for creating results
export const success = <T>(data: T): Result<T, never> => ({
  success: true,
  data,
});

export const error = <E>(error: E): Result<never, E> => ({
  success: false,
  error,
});
