// libs/expo/shared/clients/src/lib/s3/uploadFileToS3WithPresignedPost.ts
// uploadFileToS3WithPresignedPost

// 1. Request presigned upload

// const presigned = await generateClientDocumentUploadUrl({
//   filename,
//   contentType,
// });

// 2. Upload to S3

// const uploadResult = await uploadFileToS3WithPresignedPost({
//   presignedPost: presigned,
//   fileUri,
//   fileName: filename,
//   contentType,
// });

// 3. Persist in backend

// await createClientDocument({
//   file: uploadResult.key,
// });

export type PresignedPostFields = Record<string, string>;

export interface PresignedPostPayload {
  url: string;
  fields: PresignedPostFields;
  key: string;
}

export interface UploadFileToS3Input {
  presignedPost: PresignedPostPayload;
  fileUri: string;
  fileName: string;
  contentType: string;
}

export async function uploadFileToS3WithPresignedPost(
  input: UploadFileToS3Input
): Promise<{ key: string }> {
  const formData = new FormData();

  // 1. append all presigned fields EXACTLY
  for (const [fieldName, fieldValue] of Object.entries(
    input.presignedPost.fields
  )) {
    formData.append(fieldName, fieldValue);
  }

  // 2. append file LAST
  formData.append('file', {
    uri: input.fileUri,
    name: input.fileName,
    type: input.contentType,
  } as unknown as Blob);

  const response = await fetch(input.presignedPost.url, {
    method: 'POST',
    body: formData,
  });

  console.log();
  console.log(
    '| ------------- uploadFileToS3WithPresignedPost response  ------------- |'
  );
  console.log(JSON.stringify(response, null, 2));
  console.log();

  if (response.ok) {
    return { key: input.presignedPost.key };
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
