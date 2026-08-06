import type { PresignedPostPayload } from '@monorepo/react/shared';

/**
 * Validates a presigned POST payload and returns its Content-Type. Throws on
 * missing/invalid fields, mirroring the generic shared transport's contract.
 */
export function assertPresignedPost(
  presignedPost: PresignedPostPayload,
): string {
  const contentType = presignedPost.fields['Content-Type'];

  if (!contentType) {
    throw new Error('Missing Content-Type in presigned fields');
  }

  if (!presignedPost.key || presignedPost.fields['key'] !== presignedPost.key) {
    throw new Error('Presigned key mismatch between payload and fields');
  }

  return contentType;
}
