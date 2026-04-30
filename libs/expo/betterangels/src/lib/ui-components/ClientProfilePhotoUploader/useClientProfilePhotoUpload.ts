import { useMutation } from '@apollo/client/react';
import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { uploadFileToS3WithPresignedPost } from '@monorepo/expo/shared/services';
import { useCallback, useState } from 'react';
import {
  GenerateClientProfilePhotoUploadDocument,
  ResolveClientProfilePhotoUploadDocument,
} from './__generated__/clientProfilePhoto.generated';

export function useClientProfilePhotoUpload() {
  const [generateUpload] = useMutation(
    GenerateClientProfilePhotoUploadDocument
  );
  const [resolveUpload] = useMutation(ResolveClientProfilePhotoUploadDocument);

  const [processing, setProcessing] = useState(false);

  const uploadPhoto = useCallback(
    async function uploadPhoto({
      clientProfileId,
      file,
    }: {
      clientProfileId: string;
      file: ReactNativeFile;
    }) {
      setProcessing(true);

      try {
        const refId = `${Date.now()}`;

        // 1: Request presigned POST data from backend
        const result = await generateUpload({
          variables: {
            data: {
              refId,
              clientProfileId,
              filename: file.name,
              contentType: file.type,
            },
          },
        });

        const payload = result.data?.generateClientProfilePhotoUpload;

        if (!payload) {
          throw new Error('Missing response');
        }

        if (payload.__typename === 'OperationInfo') {
          throw new Error(payload.messages.map((m) => m.message).join(', '));
        }

        if (payload.__typename !== 'AuthorizedPresignedS3UploadType') {
          throw new Error('Unexpected response type');
        }

        if (!payload.uploadToken) {
          throw new Error('Missing uploadToken in presigned upload response');
        }

        // 2: Upload file directly to S3 using presigned POST
        await uploadFileToS3WithPresignedPost({
          presignedPost: {
            url: payload.url,
            fields: payload.fields as Record<string, string>,
            key: payload.presignedKey,
          },
          fileUri: file.uri,
        });

        // 3: Persist uploaded photo in backend
        const resolved = await resolveUpload({
          variables: {
            data: {
              clientProfileId,
              presignedKey: payload.presignedKey,
              uploadToken: payload.uploadToken,
            },
          },
        });

        const resolvePayload = resolved.data?.resolveClientProfilePhotoUpload;

        if (!resolvePayload) {
          throw new Error('Missing resolveUpload response');
        }

        if (resolvePayload.__typename === 'OperationInfo') {
          throw new Error(
            resolvePayload.messages.map((m) => m.message).join(', ')
          );
        }
      } finally {
        setProcessing(false);
      }
    },
    [generateUpload, resolveUpload]
  );

  return { uploadPhoto, loading: processing };
}
