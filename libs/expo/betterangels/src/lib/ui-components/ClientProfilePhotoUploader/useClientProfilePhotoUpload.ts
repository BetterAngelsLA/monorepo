import { useMutation } from '@apollo/client/react';
import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import {
  PresignedUploadError,
  runPresignedUpload,
  toPresignedUploads,
  unwrapPayload,
  type TUploadFile,
  type TUploadProgress,
} from '@monorepo/expo/shared/services';
import { abortableContext } from '../../apollo';
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
    onManifest,
    onProgress,
  }: {
    clientProfileId: string;
    file: TUploadFile;
    onManifest?: (
      manifest: Array<{ refId: string; file: ReactNativeFile }>,
    ) => void;
    onProgress?: (progress: TUploadProgress) => void;
  }) {
    await runPresignedUpload({
      files: [file],
      onManifest,
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

        return toPresignedUploads([payload]);
      },
      resolveUpload: async (saved, signal) => {
        const upload = saved[0];

        await resolveUpload({
          variables: {
            data: {
              clientProfileId,
              presignedKey: upload.presignedKey,
              uploadToken: upload.uploadToken,
            },
          },
          context: abortableContext(signal),
        });
      },
      onProgress,
    });
  }

  return { uploadPhoto };
}
