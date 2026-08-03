import { useMutation } from '@apollo/client/react';
import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import {
  PresignedUploadError,
  runPresignedUpload,
  unwrapPayload,
  type TUploadProgress,
} from '@monorepo/expo/shared/services';
import {
  GenerateClientProfilePhotoUploadDocument,
  ResolveClientProfilePhotoUploadDocument,
} from './__generated__/clientProfilePhoto.generated';

export function useClientProfilePhotoUpload() {
  const [generateUpload] = useMutation(
    GenerateClientProfilePhotoUploadDocument,
  );
  const [resolveUpload] = useMutation(ResolveClientProfilePhotoUploadDocument);

  async function uploadPhoto({
    clientProfileId,
    file,
    onProgress,
  }: {
    clientProfileId: string;
    file: ReactNativeFile;
    onProgress?: (progress: TUploadProgress) => void;
  }) {
    await runPresignedUpload({
      files: [file],
      generateUpload: async (inputs) => {
        const input = inputs[0];

        const result = await generateUpload({
          variables: {
            data: {
              refId: input.refId,
              clientProfileId,
              filename: input.filename,
              contentType: input.contentType,
            },
          },
        });

        const payload = unwrapPayload(
          result.data?.generateClientProfilePhotoUpload,
          'generate client profile photo upload',
          'AuthorizedPresignedS3UploadType',
        );

        if (!payload.uploadToken) {
          throw new PresignedUploadError(
            'Missing uploadToken in presigned upload response',
          );
        }

        return [
          {
            refId: payload.refId,
            url: payload.url,
            fields: payload.fields as Record<string, string>,
            presignedKey: payload.presignedKey,
            uploadToken: payload.uploadToken,
          },
        ];
      },
      resolveUpload: async (saved) => {
        const upload = saved[0];

        await resolveUpload({
          variables: {
            data: {
              clientProfileId,
              presignedKey: upload.presignedKey,
              uploadToken: upload.uploadToken,
            },
          },
        });
      },
      onProgress,
    });
  }

  return { uploadPhoto };
}
