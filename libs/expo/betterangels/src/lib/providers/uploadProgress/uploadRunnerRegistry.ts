/**
 * Module-scoped registry of the things that actually *drive* uploads.
 *
 * Session state and the machinery that runs it have different lifetimes and
 * different requirements. State has to be serializable — it is rendered,
 * inspected, and (once the manifest is persisted) reloaded after the app
 * restarts. The machinery is closures over abort controllers and network
 * calls, which can never be any of those things.
 *
 * Keeping runners here rather than as callbacks on the session means the
 * store stays plain data, and an upload's lifetime stops being an accident
 * of which React component happened to create it: the component that starts
 * an upload unmounts immediately, and previously the upload continued only
 * because a closure survived it.
 */
export type TUploadRunner = {
  /** Aborts one file's in-flight request. */
  cancelItem: (refId: string) => void;
  /** Re-runs the given files inside their existing session. */
  rerun: (refIds: string[]) => void;
  /** Aborts every file this runner owns. */
  cancelAll: () => void;
};

const runners = new Map<string, TUploadRunner>();

export function registerUploadRunner(
  sessionId: string,
  runner: TUploadRunner,
): void {
  runners.set(sessionId, runner);
}

export function getUploadRunner(sessionId: string): TUploadRunner | undefined {
  return runners.get(sessionId);
}

export function unregisterUploadRunner(sessionId: string): void {
  runners.delete(sessionId);
}

/**
 * Aborts every in-flight upload. Intended for teardown points where
 * continuing would be wrong regardless of session state — signing out, or
 * switching to a different backend environment.
 */
export function cancelAllUploadRunners(): void {
  runners.forEach((runner) => runner.cancelAll());
}

/** Test-only: drops every registered runner. */
export function resetUploadRunners(): void {
  runners.clear();
}
