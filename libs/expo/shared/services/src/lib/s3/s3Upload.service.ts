/**
 * S3 upload utilities for direct client-to-S3 file uploads via presigned POSTs.
 *
 * Thin Expo wrapper around the shared platform-agnostic implementation.
 * Converts a file URI to an expo-file-system File (which implements Blob)
 * and delegates to the shared upload function.
 */

import { File } from 'expo-file-system';
import {
  uploadFileToS3WithPresignedPost as uploadBlob,
  type PresignedPostPayload,
} from '@monorepo/react/shared';

export type { PresignedPostPayload } from '@monorepo/react/shared';

export interface UploadFileToS3Input {
  presignedPost: PresignedPostPayload;
  fileUri: string;
}

/**
 * Uploads a file directly to S3 using a presigned POST.
 *
 * Converts the file URI to an expo-file-system File (compatible with
 * Expo's winter fetch) and delegates to the shared implementation.
 */
export async function uploadFileToS3WithPresignedPost(
  input: UploadFileToS3Input
): Promise<{ key: string }> {
  return uploadBlob({
    presignedPost: input.presignedPost,
    file: new File(input.fileUri),
  });
}
