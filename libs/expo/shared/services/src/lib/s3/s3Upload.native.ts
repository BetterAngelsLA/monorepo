import { File, UploadType } from 'expo-file-system';
import { S3TransportError } from './errors';
import { assertPresignedPost } from './presignedPost';
import { type TS3UploadProgress, type TS3UploadTransport } from './types';

/**
 * Native S3 transport: uploads a file directly to S3 using a presigned POST
 * via expo-file-system's native upload task (multipart/form-data).
 *
 * Reliable byte-level progress and cancellation via `signal`.
 *
 * Background behaviour (`sessionType: 'background'`, set explicitly rather
 * than inherited from the SDK default so the intent is visible here):
 *  - iOS: the native transfer continues while the app is suspended.
 *  - iOS, terminated: the transfer may still land in S3, but the JS task is
 *    not restored — progress, cancellation and the resolve step are lost.
 *    Recovery depends on the pipeline's persisted manifest, not on this.
 *  - Android: the option is iOS-only, so there is no background
 *    continuation here; a suspended app stops uploading.
 */
export const uploadFileToS3WithPresignedPost: TS3UploadTransport = async ({
  presignedPost,
  file,
  onProgress,
  signal,
}) => {
  const contentType = assertPresignedPost(presignedPost);

  const task = new File(file.uri).createUploadTask(presignedPost.url, {
    httpMethod: 'POST',
    uploadType: UploadType.MULTIPART,
    fieldName: 'file',
    mimeType: contentType,
    parameters: presignedPost.fields,
    onProgress: (progress: TS3UploadProgress) => onProgress?.(progress),
    sessionType: 'background',
    signal,
  });

  let result;

  try {
    result = await task.uploadAsync();
  } catch (err) {
    // The task rejects with an AbortError when `signal` fires; everything
    // else at this layer is the request never reaching a verdict.
    throw new S3TransportError(
      err instanceof Error ? err.message : 'S3 upload failed',
      { kind: isAbortError(err) ? 'abort' : 'network' },
    );
  }

  // S3 returns 204 No Content on a successful presigned POST.
  if (result.status < 200 || result.status >= 300) {
    throw new S3TransportError(
      `S3 upload failed with status ${result.status}: ${result.body}`,
      { kind: 'http', status: result.status, body: result.body },
    );
  }

  return { key: presignedPost.key };
};

function isAbortError(err: unknown): boolean {
  return (
    !!err &&
    typeof err === 'object' &&
    (err as { name?: string }).name === 'AbortError'
  );
}
