import { useCallback, useRef, useState } from 'react';
import { useApiConfig } from '../../providers/api/ApiConfigProvider';

/**
 * Shape of each part returned by upload-initialize.
 */
interface UploadPart {
  part_number: number;
  size: number;
  upload_url: string;
}

/**
 * Response from the upload-initialize endpoint.
 */
interface InitResponse {
  object_key: string;
  upload_id: string;
  parts: UploadPart[];
  upload_signature: string;
}

/**
 * Lifecycle status of a single upload.
 */
export type UploadStatus =
  | 'idle'
  | 'uploading'
  | 'completing'
  | 'done'
  | 'error';

/**
 * Return value of useS3Upload.
 */
export interface UseS3UploadReturn {
  /** Trigger a direct-to-S3 upload. Resolves with the signed field_value. */
  upload: (file: File, fieldId: string) => Promise<string>;
  /** 0-100 progress value. */
  progress: number;
  /** Current status. */
  status: UploadStatus;
  /** Error message if status === 'error'. */
  error: string | null;
  /** Cancel an in-progress upload. */
  abort: () => void;
}

/**
 * Base path where django-s3-file-field REST endpoints are mounted.
 * Must match urls.py: `path("api/s3-upload/", include("s3_file_field.urls"))`.
 */
const S3_UPLOAD_PATH = '/api/s3-upload';

/**
 * React hook that wraps the django-s3-file-field REST API for direct-to-S3
 * multipart uploads. Does NOT require any custom GraphQL endpoint.
 *
 * Usage:
 * ```tsx
 * const { upload, progress, status, error, abort } = useS3Upload();
 * const fieldValue = await upload(file, 'shelters.InteriorPhoto.file');
 * ```
 */
export function useS3Upload(): UseS3UploadReturn {
  const { fetchClient } = useApiConfig();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const upload = useCallback(
    async (file: File, fieldId: string): Promise<string> => {
      const ac = new AbortController();
      abortRef.current = ac;

      setProgress(0);
      setStatus('uploading');
      setError(null);

      try {
        // 1. Initialize multipart upload
        const initRes = await fetchClient(
          `${S3_UPLOAD_PATH}/upload-initialize/`,
          {
            method: 'POST',
            body: JSON.stringify({
              field_id: fieldId,
              file_name: file.name,
              file_size: file.size,
              content_type: file.type || 'application/octet-stream',
            }),
          }
        );

        if (!initRes.ok) {
          throw new Error(`Initialize failed: ${initRes.status}`);
        }

        const init: InitResponse = await initRes.json();

        // 2. Upload each part directly to S3
        let uploaded = 0;
        const completedParts: {
          part_number: number;
          size: number;
          etag: string;
        }[] = [];

        for (const part of init.parts) {
          if (ac.signal.aborted) throw new Error('Upload cancelled');

          const blob = file.slice(uploaded, uploaded + part.size);
          const currentUploaded = uploaded;

          const partProgress = await uploadPart(
            part.upload_url,
            blob,
            ac.signal,
            (partLoaded) => {
              const totalLoaded = currentUploaded + partLoaded;
              setProgress(Math.round((totalLoaded / file.size) * 100));
            }
          );

          completedParts.push({
            part_number: part.part_number,
            size: part.size,
            etag: partProgress,
          });

          uploaded += part.size;
        }

        setProgress(100);
        setStatus('completing');

        // 3. Complete multipart upload
        const completeRes = await fetchClient(
          `${S3_UPLOAD_PATH}/upload-complete/`,
          {
            method: 'POST',
            body: JSON.stringify({
              upload_signature: init.upload_signature,
              upload_id: init.upload_id,
              parts: completedParts,
            }),
          }
        );

        if (!completeRes.ok) {
          throw new Error(`Complete failed: ${completeRes.status}`);
        }

        const completeData: { complete_url: string; body: string } =
          await completeRes.json();

        // 4. Call the S3 complete URL
        await fetch(completeData.complete_url, {
          method: 'POST',
          body: completeData.body,
        });

        // 5. Finalize to get the signed field_value
        const finalizeRes = await fetchClient(`${S3_UPLOAD_PATH}/finalize/`, {
          method: 'POST',
          body: JSON.stringify({
            upload_signature: init.upload_signature,
          }),
        });

        if (!finalizeRes.ok) {
          throw new Error(`Finalize failed: ${finalizeRes.status}`);
        }

        const finalizeData: { field_value: string } = await finalizeRes.json();

        setStatus('done');
        return finalizeData.field_value;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        setError(message);
        setStatus('error');
        throw err;
      } finally {
        abortRef.current = null;
      }
    },
    [fetchClient]
  );

  return { upload, progress, status, error, abort };
}

/**
 * Upload a single part to S3 via XHR (for progress tracking).
 * Returns the ETag header from the S3 response.
 */
function uploadPart(
  url: string,
  blob: Blob,
  signal: AbortSignal,
  onProgress: (loaded: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    signal.addEventListener('abort', () => {
      xhr.abort();
      reject(new Error('Upload cancelled'));
    });

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag = xhr.getResponseHeader('ETag') || '';
        resolve(etag);
      } else {
        reject(new Error(`S3 part upload failed: ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during part upload'));
    xhr.open('PUT', url);
    xhr.send(blob);
  });
}
