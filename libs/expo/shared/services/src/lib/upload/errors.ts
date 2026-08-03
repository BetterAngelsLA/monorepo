/**
 * Typed errors for the presigned upload pipeline.
 *
 * Screens can branch on the error kind to decide whether a retry makes sense
 * (e.g. S3UploadError) vs. fixing the request (PresignedUploadError) vs.
 * showing backend validation messages (OperationInfoError).
 */

export class OperationInfoError extends Error {
  readonly name = 'OperationInfoError';

  constructor(readonly messages: readonly { message: string }[]) {
    super(messages.map((m) => m.message).join(', '));
  }
}

export class PresignedUploadError extends Error {
  readonly name = 'PresignedUploadError';
}

export class S3UploadError extends Error {
  readonly name = 'S3UploadError';
  readonly details: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.details = details;
  }
}
