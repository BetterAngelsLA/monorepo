import type {
  AuthorizedPresignedS3UploadsTypename,
  OperationInfoTypename,
  ShelterPhotoUploadsTypename,
} from './types';

// Must be <= the server-side max_file_size in the S3 presigned POST policy.
// If this exceeds the server limit, the client check will pass but S3 will
// reject the upload with EntityTooLarge, showing a confusing error to users.
export const SHELTER_PHOTO_MAX_SIZE = 50_000_000;  // 50 MB

/** Verified against generated mutation types at compile time. */
export const OPERATION_INFO_TYPENAME: OperationInfoTypename = 'OperationInfo';

export const AUTHORIZED_PRESIGNED_S3_UPLOADS_TYPENAME: AuthorizedPresignedS3UploadsTypename =
  'AuthorizedPresignedS3UploadsType';

export const SHELTER_PHOTO_UPLOADS_TYPENAME: ShelterPhotoUploadsTypename =
  'ShelterPhotoUploadsType';
