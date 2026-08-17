/**
 * Transport-level S3 failure carrying enough structure to decide whether a
 * retry is worth attempting. Both the native and web transports throw this,
 * so callers never have to parse a status out of a message string.
 */
export class S3TransportError extends Error {
  readonly name = 'S3TransportError';
  /** HTTP status, when the request completed with one. */
  readonly status?: number;
  /** How the request failed, for retry classification. */
  readonly kind: 'network' | 'http' | 'abort';
  readonly body?: string;

  constructor(
    message: string,
    options: { kind: 'network' | 'http' | 'abort'; status?: number; body?: string },
  ) {
    super(message);
    this.kind = options.kind;
    this.status = options.status;
    this.body = options.body;
  }
}

/**
 * True when a failure is worth retrying: the request never reached a verdict
 * (network drop, the common case on a field connection), the server asked us
 * to back off, or it failed for a reason that is not about this request.
 *
 * Deliberately structural rather than an `instanceof` check so it also
 * classifies errors thrown across module boundaries or by other transports.
 */
export function isTransientUploadFailure(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const { kind, status } = error as { kind?: string; status?: number };

  // A cancellation is a decision, not a failure to retry around.
  if (kind === 'abort') {
    return false;
  }

  if (kind === 'network') {
    return true;
  }

  if (typeof status !== 'number') {
    // An unrecognised throw could be anything; assume it is not retryable so
    // a deterministic bug cannot turn into a retry storm.
    return false;
  }

  // 408 request timeout, 429 too many requests, 5xx server-side.
  return status === 408 || status === 429 || status >= 500;
}
