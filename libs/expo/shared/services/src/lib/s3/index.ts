import { Platform } from 'react-native';
import { uploadFileToS3WithPresignedPost as nativeUpload } from './s3Upload.native';
import { uploadFileToS3WithPresignedPost as webUpload } from './s3Upload.web';

export * from './types';
export { assertPresignedPost } from './presignedPost';

/**
 * Platform-selected S3 transport. Both implementations share the same
 * `TS3UploadTransport` interface (presigned POST + byte progress + cancel), so
 * the upload pipeline behaves identically on native and web.
 */
export const uploadFileToS3WithPresignedPost =
  Platform.OS === 'web' ? webUpload : nativeUpload;
