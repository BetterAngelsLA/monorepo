/**
 * S3 upload utilities for direct client-to-S3 file uploads via presigned POSTs.
 */

export type PresignedPostFields = Record<string, string>;

export interface PresignedPostPayload {
  url: string;
  fields: PresignedPostFields;
  key: string;
}

export interface UploadFileToS3Input {
  presignedPost: PresignedPostPayload;
  fileUri: string;
}

/**
 * Uploads a file directly to S3 using a presigned POST.
 *
 * Appends all presigned fields to a FormData payload, then appends
 * the file blob last (required by S3). Returns the S3 object key on success.
 */
export async function uploadFileToS3WithPresignedPost(
  input: UploadFileToS3Input
): Promise<{ key: string }> {
  const { presignedPost, fileUri } = input;

  const formData = new FormData();

  const presignedFields = presignedPost.fields;
  const presignedFieldsKey = presignedFields['key'];
  const contentType = presignedFields['Content-Type'];

  if (!contentType) {
    throw new Error('Missing Content-Type in presigned fields');
  }

  if (!presignedPost.key) {
    throw new Error('presignedPost.key missing.');
  }

  if (!presignedFieldsKey) {
    throw new Error('presignedPost.fields.key missing');
  }

  if (presignedPost.key !== presignedFieldsKey) {
    throw new Error('Presigned key mismatch between payload and fields');
  }

  // 1. append all presigned fields EXACTLY
  for (const [fieldName, fieldValue] of Object.entries(presignedPost.fields)) {
    formData.append(fieldName, fieldValue);
  }

  // 2. append file LAST
  formData.append('file', {
    uri: fileUri,
    type: contentType,
  } as unknown as Blob);

  const response = await fetch(presignedPost.url, {
    method: 'POST',
    body: formData,
  });

  if (response.ok) {
    return { key: presignedPost.key };
  }

  const errorText = await response.text();

  throw new Error(
    [
      'S3 upload failed',
      `status=${response.status}`,
      `statusText=${response.statusText}`,
      `body=${errorText}`,
    ].join(' ')
  );
}
