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
  }: {
    clientProfileId: string;
    documents: ReactNativeFile[];
    namespace: ClientDocumentNamespaceEnum;
    onProgress?: (progress: TUploadProgress) => void;
    onManifest?: (
      manifest: Array<{ refId: string; file: ReactNativeFile }>,
    ) => void;
  }) {
    if (!documents.length) {
      return;
    }

    await runPresignedUpload({
      files: documents,
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

  return { uploadDocuments };
}
