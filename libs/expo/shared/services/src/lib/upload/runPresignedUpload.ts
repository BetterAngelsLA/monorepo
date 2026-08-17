import { randomUUID } from 'expo-crypto';
import { filter, isNonNullish, map, pipe } from 'remeda';
import { isTransientUploadFailure, uploadFileToS3WithPresignedPost } from '../s3';
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
   * Maximum files uploading at once. Uploading every file simultaneously
   * makes each one slower on a constrained connection and tends to make a
   * whole batch time out together, so the default is deliberately small.
   */
  concurrency?: number;
  /**
   * How many times to re-attempt a file whose upload failed transiently
   * (network drop, 408/429/5xx). Permanent failures are never retried.
   */
  maxAttempts?: number;
  /** Base delay for the exponential backoff between attempts, in ms. */
  retryBaseDelayMs?: number;
  /** Injectable sleep + jitter, so tests do not wait on real backoff. */
  scheduleRetry?: (attempt: number, baseDelayMs: number) => Promise<void>;
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
 * Small on purpose: these uploads run on field connections, where firing
 * every file at once makes each one slower and tends to time the whole batch
 * out together rather than landing some of it.
 */
const DEFAULT_CONCURRENCY = 3;
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_RETRY_BASE_DELAY_MS = 500;

/** Exponential backoff with full jitter, to avoid a synchronised retry burst. */
const defaultScheduleRetry = (attempt: number, baseDelayMs: number) =>
  sleep(Math.random() * baseDelayMs * 2 ** (attempt - 1));

/**
 * Runs `task` over `items` with at most `limit` in flight, preserving input
 * order in the results. Unlike `Promise.all`, `stopOnError` also stops
 * *scheduling* further work once something has failed, so a fail-fast batch
 * does not keep uploading files whose result is already going to be thrown
 * away.
 */
async function runPool<TItem, TResult>(
  items: TItem[],
  limit: number,
  task: (item: TItem) => Promise<TResult>,
  options: { stopOnError: boolean },
): Promise<PromiseSettledResult<TResult>[]> {
  const results = new Array<PromiseSettledResult<TResult>>(items.length);
  let nextIndex = 0;
  let failed = false;

  const worker = async () => {
    for (;;) {
      if (options.stopOnError && failed) {
        return;
      }

      const index = nextIndex++;

      if (index >= items.length) {
        return;
      }

      try {
        results[index] = { status: 'fulfilled', value: await task(items[index]) };
      } catch (reason) {
        failed = true;
        results[index] = { status: 'rejected', reason };
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, worker),
  );

  // Items never scheduled because of an early failure leave holes.
  return [...results].filter(Boolean);
}

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
    concurrency = DEFAULT_CONCURRENCY,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    retryBaseDelayMs = DEFAULT_RETRY_BASE_DELAY_MS,
    scheduleRetry = defaultScheduleRetry,
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

      const sendOnce = () =>
        uploadFileToS3WithPresignedPost({
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

      // A dropped packet on a field connection is the common case, not an
      // exceptional one, so transient failures are re-attempted here rather
      // than surfaced as something the user has to act on.
      for (let attempt = 1; ; attempt += 1) {
        try {
          await sendOnce();
          break;
        } catch (err) {
          const canRetry =
            attempt < maxAttempts &&
            isTransientUploadFailure(err) &&
            !file.signal?.aborted &&
            !signal?.aborted;

          if (!canRetry) {
            throw err;
          }

          // Restart the progress bar: the next attempt re-sends from zero.
          lastPercent = -1;
          emit('UPLOADING', {
            refId: upload.refId,
            status: 'uploading',
            bytesSent: 0,
            totalBytes: 0,
          });

          await scheduleRetry(attempt, retryBaseDelayMs);
        }
      }

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

  const settled = await runPool(presignedUploads, concurrency, uploadOne, {
    stopOnError: failFast,
  });

  if (failFast) {
    const firstFailure = settled.find((result) => result.status === 'rejected');

    if (firstFailure?.status === 'rejected') {
      throw firstFailure.reason;
    }
  }

  const succeeded = pipe(
    settled,
    map((result) => (result.status === 'fulfilled' ? result.value : null)),
    filter(isNonNullish),
  );

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
