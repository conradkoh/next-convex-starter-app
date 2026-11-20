/**
 * Local-development detection shared by the Convex backend and the Next webapp.
 *
 * `process.env.NODE_ENV` is NOT guaranteed inside Convex functions, so the signal is the
 * deployment URL instead: a local Convex backend serves from a loopback address
 * (http://127.0.0.1:3210) while hosted deployments use a public host (*.convex.cloud).
 * Each runtime passes the URL it can see; the backend uses CONVEX_CLOUD_URL and the webapp
 * uses NEXT_PUBLIC_CONVEX_URL, which point at the same deployment.
 *
 * Defaults to `false` when the URL is missing or unparseable (hosted deployments, tests).
 */
const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

/** True when `url` parses and its hostname is a loopback address. */
export function isLoopbackUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  try {
    return LOOPBACK_HOSTNAMES.has(new URL(url).hostname.toLowerCase());
  } catch {
    return false;
  }
}

/** Backend-side check. Evaluated per call so tests can stub the env. */
export function isLocalDevelopment(): boolean {
  return isLoopbackUrl(process.env.CONVEX_CLOUD_URL);
}
