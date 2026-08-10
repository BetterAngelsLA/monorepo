import { File, UploadType } from 'expo-file-system';
import { assertPresignedPost } from './presignedPost';
import { type TS3UploadProgress, type TS3UploadTransport } from './types';

/**
 * Native S3 transport: uploads a file directly to S3 using a presigned POST
 * via expo-file-system's native upload task (multipart/form-data).
 *
 * Reliable byte-level progress, cancellation via `signal`, and iOS background
 * session support. Native only (Android/iOS/tvOS).
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
    signal,
  });

  const result = await task.uploadAsync();

  // S3 returns 204 No Content on a successful presigned POST.
  if (result.status < 200 || result.status >= 300) {
    throw new Error(
      `S3 upload failed with status ${result.status}: ${result.body}`,
    );
  }

  return { key: presignedPost.key };
};
