// fallow-ignore-file unused-file
export interface ErrorReport {
  error: unknown;
  /** Where it was caught, e.g. 'route:root', 'navigation', 'app-providers', 'global'. */
  scope: string;
  componentStack?: string | null;
  digest?: string;
}
export type ErrorReporter = (report: ErrorReport) => void;

const consoleReporter: ErrorReporter = (report) => {
  console.error('[app-error]', report.scope, report.error, {
    digest: report.digest,
    componentStack: report.componentStack,
  });
};

let activeReporter: ErrorReporter = consoleReporter;

/** Swap the reporter (vendor adapter in forks; spies in tests). Returns a restore function. */
export function setErrorReporter(reporter: ErrorReporter): () => void {
  const previous = activeReporter;
  activeReporter = reporter;
  return () => {
    activeReporter = previous;
  };
}

/** Report a caught error. Never throws. */
export function reportError(report: ErrorReport): void {
  try {
    activeReporter(report);
  } catch {
    // A broken reporter must never break error UI.
  }
}
