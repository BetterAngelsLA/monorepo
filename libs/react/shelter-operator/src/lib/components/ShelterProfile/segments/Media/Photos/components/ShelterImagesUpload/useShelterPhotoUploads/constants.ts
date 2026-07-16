// Must be <= the server-side max_file_size in the S3 presigned POST policy.
// If this exceeds the server limit, the client check will pass but S3 will
// reject the upload with EntityTooLarge, showing a confusing error to users.
export const SHELTER_PHOTO_MAX_SIZE = 10_000_000;
