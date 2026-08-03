import { randomUUID } from 'expo-crypto';
import { uploadFileToS3WithPresignedPost } from '../s3';
import { PresignedUploadError, S3UploadError } from './errors';
import {
  TPresignedUpload,
  TUploadFile,
  TUploadInput,
  TUploadProgress,
  TUploadStage,
  TSavedUpload,
} from './types';

export type TRunPresignedUploadArgs<TResolve> = {
  files: TUploadFile[];
  /**
   * Requests presigned POSTs for the given inputs. Must return one entry per
   * input, keyed by the same `refId`.
   */
  generateUpload: (inputs: TUploadInput[]) => Promise<TPresignedUpload[]>;
  /** Persists the successfully uploaded files and returns the caller's result. */
  resolveUpload: (saved: TSavedUpload[]) => Promise<TResolve>;
  /** Called on stage changes and per-file upload progress. */
  onProgress?: (progress: TUploadProgress) => void;
  /** Aborts the pipeline between steps (and before each S3 upload). */
  signal?: AbortSignal;
  /**
   * When true (default), the first failed file rejects the whole batch.
   * When false, successful files are still persisted and failures are reported
   * via `onProgress` (throwing only if every file fails).
   */
  failFast?: boolean;
  /** Injectable id generator (defaults to expo-crypto). Useful for tests. */
  generateRefId?: () => string;
};

/**
 * Orchestrates a presigned S3 upload: request presigned POSTs, upload each
 * file directly to S3 in parallel, then persist the successful uploads.
 *
 * Pure orchestration — GraphQL/Apollo concerns live in the callers, which
 * inject `generateUpload` and `resolveUpload`. This keeps the pipeline
 * framework-agnostic and unit-testable without React or Apollo mocks.
 */
export async function runPresignedUpload<TResolve>(
  args: TRunPresignedUploadArgs<TResolve>,
): Promise<TResolve> {
  const {
    files,
    generateUpload,
    resolveUpload,
    onProgress,
    signal,
    failFast = true,
    generateRefId = randomUUID,
  } = args;

  if (!files.length) {
    throw new PresignedUploadError('No files to upload');
  }

  let completed = 0;
  const total = files.length;

  const emit = (
    stage: TUploadStage,
    extra?: Pick<TUploadProgress, 'refId' | 'status' | 'error'>,
  ) => {
    onProgress?.({ stage, completed, total, ...extra });
  };

  const throwIfAborted = () => {
    if (signal?.aborted) {
      throw new PresignedUploadError('Upload aborted');
    }
  };

  // 1. Correlate files to refIds so server responses map back to originals.
  const manifest = files.map((file) => ({ refId: generateRefId(), file }));
  const fileByRefId = new Map(manifest.map((entry) => [entry.refId, entry.file]));

  // 2. Request presigned POSTs from the backend.
  throwIfAborted();
  emit('GENERATING');

  const presignedUploads = await generateUpload(
    manifest.map((entry) => ({
      refId: entry.refId,
      filename: entry.file.name,
      contentType: entry.file.type,
    })),
  );

  if (presignedUploads.length !== manifest.length) {
    throw new PresignedUploadError(
      'Upload response did not match requested files',
    );
  }

  // 3. Upload each file directly to S3 (parallel), reporting per-file progress.
  throwIfAborted();
  emit('UPLOADING');

  const uploadOne = async (
    upload: TPresignedUpload,
  ): Promise<TPresignedUpload> => {
    throwIfAborted();

    const file = fileByRefId.get(upload.refId);

    if (!file) {
      throw new PresignedUploadError(`Missing file for refId ${upload.refId}`);
    }

    emit('UPLOADING', { refId: upload.refId, status: 'started' });

    try {
      await uploadFileToS3WithPresignedPost({
        presignedPost: {
          url: upload.url,
          fields: upload.fields,
          key: upload.presignedKey,
        },
        fileUri: file.uri,
      });

      completed += 1;
      emit('UPLOADING', { refId: upload.refId, status: 'done' });

      return upload;
    } catch (err) {
      emit('UPLOADING', { refId: upload.refId, status: 'error', error: err });

      throw new S3UploadError(`Failed to upload ${file.name}`, err);
    }
  };

  let succeeded: TPresignedUpload[];

  if (failFast) {
    succeeded = await Promise.all(presignedUploads.map(uploadOne));
  } else {
    const settled = await Promise.allSettled(presignedUploads.map(uploadOne));

    succeeded = settled
      .map((result) => (result.status === 'fulfilled' ? result.value : null))
      .filter((value): value is TPresignedUpload => value !== null);

    if (!succeeded.length) {
      throw new PresignedUploadError('All file uploads failed');
    }
  }

  // 4. Persist the successful uploads.
  throwIfAborted();
  emit('SAVING');

  const savedUploads = succeeded.map((upload) => {
    const file = fileByRefId.get(upload.refId);

    if (!file) {
      throw new PresignedUploadError(`Missing file for refId ${upload.refId}`);
    }

    return {
      presignedKey: upload.presignedKey,
      filename: file.name,
      contentType: file.type,
      uploadToken: upload.uploadToken,
    };
  });

  return resolveUpload(savedUploads);
}
