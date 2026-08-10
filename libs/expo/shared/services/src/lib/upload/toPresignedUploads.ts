import type { TPresignedUpload } from './types';

/**
 * Presigned-upload payload shape returned by the backend generate mutations.
 * `fields` is a GraphQL JSON scalar (typed `any` at the boundary), so it's
 * narrowed to the pipeline's expected shape here.
 */
type TPresignedUploadPayload = {
  refId: string;
  url: string;
  fields: unknown;
  presignedKey: string;
  uploadToken: string;
};

/**
 * Normalizes backend generate responses into the pipeline's `TPresignedUpload`
 * shape so every caller maps GraphQL payloads identically.
 */
export function toPresignedUploads(
  payloads: TPresignedUploadPayload[],
): TPresignedUpload[] {
  return payloads.map((payload) => ({
    refId: payload.refId,
    url: payload.url,
    fields: payload.fields as Record<string, string>,
    presignedKey: payload.presignedKey,
    uploadToken: payload.uploadToken,
  }));
}
