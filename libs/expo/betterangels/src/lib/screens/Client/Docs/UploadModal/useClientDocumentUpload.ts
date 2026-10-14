import { useMutation } from '@apollo/client/react';
import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import {
  runPresignedUpload,
  toPresignedUploads,
  unwrapPayload,
  type TUploadProgress,
} from '@monorepo/expo/shared/services';
import {
  abortableContext,
  ClientDocumentNamespaceEnum,
} from '../../../../apollo';
import { ClientProfileDocument } from '../../__generated__/Client.generated';
import {
  GenerateClientDocumentUploadsDocument,
  ResolveClientDocumentUploadsDocument,
} from './__generated__/clientDocumentUploads.generated';

export function useClientDocumentUpload() {
  const [createUploads] = useMutation(GenerateClientDocumentUploadsDocument);
  const [resolveUploads] = useMutation(ResolveClientDocumentUploadsDocument);

  async function uploadDocuments({
    clientProfileId,
    documents,
    namespace,
    onProgress,
    onManifest,
    onPresigned,
  }: {
    clientProfileId: string;
    documents: ReactNativeFile[];
    namespace: ClientDocumentNamespaceEnum;
    onProgress?: (progress: TUploadProgress) => void;
    onManifest?: (
      manifest: Array<{ refId: string; file: ReactNativeFile }>,
    ) => void;
    onPresigned?: (
      uploads: Array<{
        refId: string;
        presignedKey: string;
        uploadToken: string;
      }>,
    ) => void;
  }) {
    if (!documents.length) {
      return;
    }

    await runPresignedUpload({
      files: documents,
      onPresigned,
      // Persist the files that made it. With fail-fast the save step is
      // skipped entirely when any single file fails, which would strand the
      // successful uploads in S3 with no document record — and per-file
      // retry assumes the files it is not retrying were already saved.
      failFast: false,
      onManifest,
      generateUpload: async (inputs) => {
        const result = await createUploads({
          variables: {
            data: { clientProfileId, uploads: inputs },
          },
        });

        const payload = unwrapPayload(
          result.data?.generateClientDocumentUploads,
          'generate client document uploads',
          'AuthorizedPresignedS3UploadsType',
        );

        return toPresignedUploads(payload.uploads);
      },
      resolveUpload: async (saved, signal) => {
        const result = await resolveUploads({
          variables: {
            data: {
              clientProfileId,
              documents: saved.map((upload) => ({ ...upload, namespace })),
            },
          },
          context: abortableContext(signal),
          refetchQueries: [
            {
              query: ClientProfileDocument,
              variables: { id: clientProfileId },
            },
          ],
        });

        unwrapPayload(
          result.data?.resolveClientDocumentUploads,
          'resolve client document uploads',
          'ClientDocumentUploadsType',
        );
      },
      onProgress,
    });
  }

  /**
   * Records already-uploaded files without re-sending their bytes. Used when
   * resuming a session whose objects reached S3 before the app died, and
   * whose presigned credentials have not expired yet.
   */
  async function resolveUploadedDocuments({
    clientProfileId,
    namespace,
    saved,
  }: {
    clientProfileId: string;
    namespace: ClientDocumentNamespaceEnum;
    saved: Array<{
      presignedKey: string;
      filename: string;
      contentType: string;
      uploadToken: string;
    }>;
  }) {
    if (!saved.length) {
      return;
    }

    const result = await resolveUploads({
      variables: {
        data: {
          clientProfileId,
          documents: saved.map((upload) => ({ ...upload, namespace })),
        },
      },
      refetchQueries: [
        { query: ClientProfileDocument, variables: { id: clientProfileId } },
      ],
    });

    unwrapPayload(
      result.data?.resolveClientDocumentUploads,
      'resolve client document uploads',
      'ClientDocumentUploadsType',
    );
  }

  return { uploadDocuments, resolveUploadedDocuments };
}
