export type { PresignedPostPayload } from '@monorepo/react/shared';

export { assertPresignedPost } from './presignedPost';

/** Byte-level upload progress reported by the S3 transport. */
export type TS3UploadProgress = {
  bytesSent: number;
  totalBytes: number;
};

/** A file to upload (platform-agnostic shape). */
export type TS3UploadFile = {
  uri: string;
  name: string;
  type: string;
};

export type TS3UploadInput = {
  presignedPost: PresignedPostPayload;
  file: TS3UploadFile;
  /** Byte-level upload progress (when the platform supports it). */
  onProgress?: (progress: TS3UploadProgress) => void;
  /** Cancels the upload when aborted. */
  signal?: AbortSignal;
};

/**
 * Single interface implemented by both the native (expo-file-system) and web
 * (XHR) S3 transports so the upload pipeline behaves identically on every
 * platform.
 */
export type TS3UploadTransport = (
  input: TS3UploadInput,
) => Promise<{ key: string }>;
