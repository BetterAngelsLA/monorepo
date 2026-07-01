import type {
  GenerateShelterPhotoUploadsMutation,
  ResolveShelterPhotoUploadsMutation,
} from './__generated__/useShelterPhotoUploads.generated';

/**
 * Compile-time guards so runtime __typename constants stay in sync
 * with the generated mutation types. If the backend renames a type,
 * the build fails.
 */

export type OperationInfoTypename = Extract<
  NonNullable<
    GenerateShelterPhotoUploadsMutation['generateShelterPhotoUploads']
  >,
  { __typename: 'OperationInfo' }
>['__typename'];

export type AuthorizedPresignedS3UploadsTypename = Extract<
  NonNullable<
    GenerateShelterPhotoUploadsMutation['generateShelterPhotoUploads']
  >,
  { __typename: 'AuthorizedPresignedS3UploadsType' }
>['__typename'];

export type ShelterPhotoUploadsTypename = Extract<
  NonNullable<ResolveShelterPhotoUploadsMutation['resolveShelterPhotoUploads']>,
  { __typename: 'ShelterPhotoUploadsType' }
>['__typename'];
