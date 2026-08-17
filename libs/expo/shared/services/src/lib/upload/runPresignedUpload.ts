import { randomUUID } from 'expo-crypto';
import { filter, isNonNullish, map, pipe } from 'remeda';
import { uploadFileToS3WithPresignedPost } from '../s3';
import { PresignedUploadError, S3UploadError, UploadAbortedError } from './errors';
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
  /**
   * Persists the successfully uploaded files and returns the caller's result.
   * Receives the pipeline's abort signal so the save itself can be cancelled.
   */
  resolveUpload: (saved: TSavedUpload[], signal?: AbortSignal) => Promise<TResolve>;
  /** Called on stage changes and per-file upload progress. */
  onProgress?: (progress: TUploadProgress) => void;
  /**
   * Called once the refId/file correlation is built, before the backend is
   * contacted. Useful for surfacing per-file state (e.g. names) in the UI.
   */
  onManifest?: (manifest: Array<{ refId: string; file: TUploadFile }>) => void;
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
  /**
   * TEST TOOLING ONLY: artificially delays each stage (GENERATING, per-file
   * UPLOADING, SAVING) so upload progress is visible while developing the UI.
   * Wired up only in tests — the shipped uploaders do not set it.
   */
  simulateDelayMs?: number;
};

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

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
    onManifest,
    signal,
    failFast = true,
    generateRefId = randomUUID,
    simulateDelayMs = 0,
  } = args;

  if (!files.length) {
    throw new PresignedUploadError('No files to upload');
  }

  let completed = 0;
  const total = files.length;

  const emit = (
    stage: TUploadStage,
    extra?: Pick<
      TUploadProgress,
      'refId' | 'status' | 'error' | 'bytesSent' | 'totalBytes'
    >,
  ) => {
    onProgress?.({ stage, completed, total, ...extra });
  };

  const slowDown = () =>
    simulateDelayMs > 0 ? sleep(simulateDelayMs) : undefined;

  const throwIfAborted = () => {
    if (signal?.aborted) {
      throw new UploadAbortedError();
    }
  };

  // 1. Correlate files to refIds so server responses map back to originals.
  // A caller-supplied refId wins so a retry run reports against the row the
  // file already occupies rather than creating a new one.
  const manifest = files.map((file) => ({
    refId: file.refId ?? generateRefId(),
    file,
  }));
  onManifest?.(manifest);
  const fileByRefId = new Map(
    manifest.map((entry) => [entry.refId, entry.file]),
  );

  // 2. Request presigned POSTs from the backend.
  throwIfAborted();
  emit('GENERATING');
  await slowDown();

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
  ): Promise<TPresignedUpload | null> => {
    throwIfAborted();

    const file = fileByRefId.get(upload.refId);

    if (!file) {
      throw new PresignedUploadError(`Missing file for refId ${upload.refId}`);
    }

    // Per-file cancel: files cancelled before their upload starts are skipped
    // without failing the batch.
    if (file.signal?.aborted) {
      return null;
    }

    emit('UPLOADING', { refId: upload.refId, status: 'uploading' });
    await slowDown();

    try {
      let lastPercent = -1;

      await uploadFileToS3WithPresignedPost({
        presignedPost: {
          url: upload.url,
          fields: upload.fields,
          key: upload.presignedKey,
        },
        file,
        signal: file.signal ?? signal,
        onProgress: ({ bytesSent, totalBytes }) => {
          // Throttle to 1% steps so byte events don't flood React state.
          const percent =
            totalBytes > 0 ? Math.floor((bytesSent / totalBytes) * 100) : -1;

          if (percent === lastPercent) {
            return;
          }

          lastPercent = percent;
          emit('UPLOADING', {
            refId: upload.refId,
            status: 'uploading',
            bytesSent,
            totalBytes,
          });
        },
      });

      completed += 1;
      emit('UPLOADING', { refId: upload.refId, status: 'done' });

      return upload;
    } catch (err) {
      // Per-file cancel mid-upload: skip the file, don't fail the batch, and
      // don't report an 'error' status — a cancellation isn't a failure.
      if (file.signal?.aborted) {
        return null;
      }

      emit('UPLOADING', {
        refId: upload.refId,
        status: 'error',
        error: err,
      });

      throwIfAborted();

      throw new S3UploadError(`Failed to upload ${file.name}`, err);
    }
  };

  let succeeded: TPresignedUpload[];

  if (failFast) {
    const results = await Promise.all(presignedUploads.map(uploadOne));
    succeeded = results.filter(
      (upload): upload is TPresignedUpload => upload !== null,
    );
  } else {
    const settled = await Promise.allSettled(presignedUploads.map(uploadOne));

    succeeded = pipe(
      settled,
      map((result) =>
        result.status === 'fulfilled' ? result.value : null,
      ),
      filter(isNonNullish),
    );
  }

  if (!succeeded.length) {
    // Every file was cancelled, not failed — surface an abort so the caller
    // treats it as a cancellation rather than a batch failure.
    if (files.every((file) => file.signal?.aborted)) {
      throw new UploadAbortedError();
    }

    throw new PresignedUploadError('All file uploads failed');
  }

  // 4. Persist the successful uploads.
  throwIfAborted();
  emit('SAVING');
  await slowDown();

  // Drop files cancelled after their S3 upload finished so they are not
  // persisted.
  const remaining = succeeded.filter((upload) => {
    const file = fileByRefId.get(upload.refId);

    return !file?.signal?.aborted;
  });

  if (!remaining.length) {
    throw new UploadAbortedError();
  }

  const savedUploads = remaining.map((upload) => {
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

  try {
    const result = await resolveUpload(savedUploads, signal);

    // A cancelled save never reports success, even if the request landed.
    throwIfAborted();

    return result;
  } catch (err) {
    throwIfAborted();

    throw err;
  }
}
