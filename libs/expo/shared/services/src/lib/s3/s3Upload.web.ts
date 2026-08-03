import {
  assertPresignedPost,
  type TS3UploadProgress,
  type TS3UploadTransport,
} from './types';

/**
 * Web S3 transport: uploads a file directly to S3 using a presigned POST via
 * XMLHttpRequest (multipart/form-data).
 *
 * XHR exposes `upload.onprogress`, which gives reliable byte-level progress in
 * browsers and supports cancellation via `AbortController`. The file URI is
 * fetched into a Blob first (picked-file URIs / blob: URLs are fetchable).
 */
export const uploadFileToS3WithPresignedPost: TS3UploadTransport = async ({
  presignedPost,
  file,
  onProgress,
  signal,
}) => {
  const contentType = assertPresignedPost(presignedPost);

  const blob = await fetch(file.uri).then((response) => response.blob());

  const formData = new FormData();
  for (const [fieldName, fieldValue] of Object.entries(presignedPost.fields)) {
    formData.append(fieldName, fieldValue);
  }
  formData.append(
    'file',
    new Blob([blob], { type: contentType }),
    file.name,
  );

  return new Promise<{ key: string }>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', presignedPost.url);

    request.upload.onprogress = (event: ProgressEvent) => {
      if (!event.lengthComputable) {
        return;
      }

      onProgress?.({
        bytesSent: event.loaded,
        totalBytes: event.total,
      } satisfies TS3UploadProgress);
    };

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve({ key: presignedPost.key });
        return;
      }

      reject(
        new Error(
          `S3 upload failed with status ${request.status}: ${request.responseText}`,
        ),
      );
    };

    request.onerror = () => {
      reject(new Error('S3 upload failed: network error'));
    };

    request.onabort = () => {
      reject(new Error('S3 upload aborted'));
    };

    signal?.addEventListener('abort', () => {
      request.abort();
    });

    request.send(formData);
  });
};
