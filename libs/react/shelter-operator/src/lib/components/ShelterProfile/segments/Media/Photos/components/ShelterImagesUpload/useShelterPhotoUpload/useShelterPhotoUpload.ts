import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { uploadFileToS3WithPresignedPost } from '@monorepo/react/shared';
import { ShelterPhotoTypeChoices } from '../../../../../../../../apollo/graphql/__generated__/types';
import {
  GenerateShelterPhotoUploadsDocument,
  ResolveShelterPhotoUploadsDocument,
} from './__generated__/useShelterPhotoUploads.generated';

export function useShelterPhotoUpload() {
  const [generateUploads] = useMutation(GenerateShelterPhotoUploadsDocument);
  const [resolveUploads] = useMutation(ResolveShelterPhotoUploadsDocument);

  async function uploadPhotos({
    shelterId,
    files,
    photoType,
  }: {
    shelterId: string;
    files: File[];
    photoType: ShelterPhotoTypeChoices;
  }) {
    if (!files.length) {
      return;
    }

    // 1. Prepare upload inputs + build refId → File map
    const fileMap = new Map<string, File>();

    const uploadInputs = files.map((file, index) => {
      const refId = `${Date.now()}-${index}`;
      fileMap.set(refId, file);
      return {
        refId,
        filename: file.name,
        contentType: file.type,
      };
    });

    // 2. Request presigned POST data from backend
    const result = await generateUploads({
      variables: {
        data: {
          shelterId,
          uploads: uploadInputs,
        },
      },
    });

    const payload = result.data?.generateShelterPhotoUploads;

    if (!payload) {
      throw new Error('Missing response from generateShelterPhotoUploads');
    }

    if (payload.__typename === 'OperationInfo') {
      throw new Error(payload.messages.map((m) => m.message).join(', '));
    }

    if (payload.__typename !== 'AuthorizedPresignedS3UploadsType') {
      throw new Error('Unexpected response type');
    }

    // 3. Upload files directly to S3 using presigned POST
    await Promise.all(
      payload.uploads.map((upload) => {
        const file = fileMap.get(upload.refId);

        if (!file) {
          throw new Error(`Missing file for refId ${upload.refId}`);
        }

        return uploadFileToS3WithPresignedPost({
          presignedPost: {
            url: upload.url,
            fields: upload.fields as Record<string, string>,
            key: upload.presignedKey,
          },
          file,
        });
      })
    );

    // 4. Resolve uploaded photos in backend
    const photosToSave = payload.uploads.map((upload) => {
      const file = fileMap.get(upload.refId);

      if (!file) {
        throw new Error(`Missing file for refId ${upload.refId}`);
      }

      return {
        presignedKey: upload.presignedKey,
        uploadToken: upload.uploadToken,
        photoType,
        filename: file.name,
        contentType: file.type,
      };
    });

    const resolved = await resolveUploads({
      variables: {
        data: {
          shelterId,
          photos: photosToSave,
        },
      },
      update(cache, { data }) {
        const resolveResult = data?.resolveShelterPhotoUploads;

        if (resolveResult?.__typename !== 'ShelterPhotoUploadsType') {
          return;
        }

        cache.modify({
          id: cache.identify({ __typename: 'AdminShelterType', id: shelterId }),
          fields: {
            photos(existing = []) {
              const newRefs = resolveResult.photos.map((photo) =>
                cache.writeFragment({
                  data: photo,
                  fragment: gql`
                    fragment NewShelterPhoto on ShelterPhotoType {
                      id
                      type
                      createdAt
                      file {
                        name
                        url
                      }
                    }
                  `,
                })
              );
              return [...existing, ...newRefs];
            },
          },
        });
      },
    });

    const resolvePayload = resolved.data?.resolveShelterPhotoUploads;

    if (!resolvePayload) {
      throw new Error('Missing response from resolveShelterPhotoUploads');
    }

    if (resolvePayload.__typename === 'OperationInfo') {
      throw new Error(resolvePayload.messages.map((m) => m.message).join(', '));
    }
  }

  return { uploadPhotos };
}
