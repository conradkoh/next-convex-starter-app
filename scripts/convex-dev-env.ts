/**
 * Default env vars for Convex dev/codegen.
 * Set in Bun scripts instead of package.json so Windows (cmd/PowerShell) works.
 */
export function applyConvexDevEnvDefaults(): void {
  process.env.CONVEX_NON_INTERACTIVE ??= 'true';
  process.env.DOCUMENT_RETENTION_DELAY ??= '1';
  process.env.INDEX_RETENTION_DELAY ??= '1';
  process.env.RETENTION_DELETE_FREQUENCY ??= '10';
}
