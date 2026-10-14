/**
 * Apollo mutation options that abort the underlying request when the given
 * signal fires — used to cancel in-flight persist mutations when a user
 * cancels an upload.
 */
export function abortableContext(signal?: AbortSignal) {
  return signal ? { fetchOptions: { signal } } : undefined;
}
