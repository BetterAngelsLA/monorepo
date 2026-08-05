import { useMutation } from '@apollo/client/react';
import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import {
  runPresignedUpload,
  unwrapPayload,
  type TUploadProgress,
} from '@monorepo/expo/shared/services';
import { ClientDocumentNamespaceEnum } from '../../../../apollo';
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
    signal,
    onProgress,
    onManifest,
  }: {
    clientProfileId: string;
    documents: ReactNativeFile[];
    namespace: ClientDocumentNamespaceEnum;
    signal?: AbortSignal;
    onProgress?: (progress: TUploadProgress) => void;
    onManifest?: (
      manifest: Array<{ refId: string; file: ReactNativeFile }>,
    ) => void;
  }) {
    if (!documents.length) {
      return;
    }

    // TEST TOOLING: set EXPO_PUBLIC_SIMULATE_UPLOAD_DELAY_MS (e.g. 1500) to
    // artificially slow down uploads while developing/testing the UI.
    const simulateDelayMs =
      Number(process.env.EXPO_PUBLIC_SIMULATE_UPLOAD_DELAY_MS) || 0;

    await runPresignedUpload({
      files: documents,
      simulateDelayMs,
      signal,
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

        return payload.uploads.map((upload) => ({
          refId: upload.refId,
          url: upload.url,
          fields: upload.fields as Record<string, string>,
          presignedKey: upload.presignedKey,
          uploadToken: upload.uploadToken,
        }));
      },
      resolveUpload: async (saved, signal) => {
        const result = await resolveUploads({
          variables: {
            data: {
              clientProfileId,
              documents: saved.map((upload) => ({ ...upload, namespace })),
            },
          },
          // Aborts the persist request when the user cancels the upload.
          context: signal ? { fetchOptions: { signal } } : undefined,
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
