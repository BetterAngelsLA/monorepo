import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  parseS3Error,
  uploadFileToS3WithPresignedPost,
} from '@monorepo/react/shared';
import { ShelterPhotoTypeChoices } from '../../../../../../../../apollo/graphql/__generated__/types';
import { OPERATOR_SHELTER_TYPENAME } from '../../../../../../../../hooks/useShelterOperatorProfile/constants';
import {
  GenerateShelterPhotoUploadsDocument,
  ResolveShelterPhotoUploadsDocument,
} from './__generated__/useShelterPhotoUploads.generated';
import { SHELTER_PHOTO_MAX_SIZE } from './constants';

function userFacingError(error: unknown): string {
  const message = parseS3Error(error);

  if (
    message.includes('EntityTooLarge') ||
    message.includes('exceeds the maximum')
  ) {
    return 'File too large.';
  }

  return 'An unexpected error occurred.';
}

function getFileErrors(files: File[], maxFileSizeBytes?: number) {
  if (!maxFileSizeBytes) {
    return null;
  }

  const fileNames = files
    .filter((f) => f.size > maxFileSizeBytes)
    .map((f) => f.name);

  if (!fileNames.length) {
    return null;
  }

  return fileNames.length === 1
    ? `File is too large: ${fileNames[0]}`
    : `Files are too large: ${fileNames.join(', ')}`;
}

type TProps = {
  maxFileSizeBytes?: number;
};

export function useShelterPhotoUpload(props?: TProps) {
  const { maxFileSizeBytes = SHELTER_PHOTO_MAX_SIZE } = props ?? {};

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

    const sizeError = getFileErrors(files, maxFileSizeBytes);

    if (sizeError) {
      throw new Error(sizeError);
    }

    // 1. Prepare upload inputs + build refId → File map
    const fileMap = new Map<string, File>();

    const uploadInputs = files.map((file) => {
      const refId = crypto.randomUUID();

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
    try {
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
    } catch (error) {
      throw new Error(userFacingError(error));
    }

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
          id: cache.identify({
            __typename: OPERATOR_SHELTER_TYPENAME,
            id: shelterId,
          }),
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
