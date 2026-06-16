export interface PresignedPostPayload {
  url: string;
  fields: Record<string, string>;
  key: string;
}

export interface UploadFileToS3Input {
  presignedPost: PresignedPostPayload;
  file: File;
}

/**
 * Uploads a file directly to S3 using a presigned POST.
 *
 * Appends all presigned fields to a FormData payload, then appends
 * the file last (required by S3). Returns the S3 object key on success.
 */
export async function uploadFileToS3WithPresignedPost(
  input: UploadFileToS3Input
): Promise<{ key: string }> {
  const { presignedPost, file } = input;

  const presignedFields = presignedPost.fields;
  const presignedFieldsKey = presignedFields['key'];

  if (!presignedPost.key) {
    throw new Error('presignedPost.key missing.');
  }

  if (!presignedFieldsKey) {
    throw new Error('presignedPost.fields.key missing');
  }

  if (presignedPost.key !== presignedFieldsKey) {
    throw new Error('Presigned key mismatch between payload and fields');
  }

  const formData = new FormData();

  // 1. Append all presigned fields EXACTLY
  for (const [fieldName, fieldValue] of Object.entries(presignedPost.fields)) {
    formData.append(fieldName, fieldValue);
  }

  // 2. Append file LAST (required by S3)
  formData.append('file', file);

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
