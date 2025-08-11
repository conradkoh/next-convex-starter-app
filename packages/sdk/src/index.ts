/**
 * Public entry for the shared SDK.
 * Keep exports minimal and stable. Add modules under src/ and export here.
 */

export const version = '0.1.0';

/**
 * Returns the SDK semantic version string.
 */
export function getVersion(): string {
  return version;
}
