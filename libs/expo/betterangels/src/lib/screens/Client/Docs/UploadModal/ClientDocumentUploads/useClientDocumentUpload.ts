import { useMutation } from '@apollo/client/react';
import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { uploadFileToS3WithPresignedPost } from '@monorepo/expo/shared/services';
import { ClientDocumentNamespaceEnum } from '../../../../../apollo';
import { ClientProfileDocument } from '../../../__generated__/Client.generated';
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
  }: {
    clientProfileId: string;
    documents: ReactNativeFile[];
    namespace: ClientDocumentNamespaceEnum;
  }) {
    if (!documents.length) {
      return;
    }

    // 1: Prepare upload inputs + build refId → file map
    // refId is to correlate server response back to original file
    const documentUploadMap = new Map<string, ReactNativeFile>();

    const uploadInputs = documents.map((doc, index) => {
      const refId = `${Date.now()}-${index}`;

      documentUploadMap.set(refId, doc);

      return {
        refId,
        filename: doc.name,
        contentType: doc.type,
      };
    });

    // 2: Request presigned POST data from backend
    const result = await createUploads({
      variables: {
        data: {
          clientProfileId,
          uploads: uploadInputs,
        },
      },
    });

    const payload = result.data?.generateClientDocumentUploads;

    if (!payload) {
      throw new Error('Missing response');
    }

    if (payload.__typename === 'OperationInfo') {
      throw new Error(payload.messages.map((m) => m.message).join(', '));
    }

    if (payload.__typename !== 'AuthorizedPresignedS3UploadsType') {
      throw new Error('Unexpected response type');
    }

    // 3: Upload files directly to S3 using presigned POST
    await Promise.all(
      payload.uploads.map((fileUpload) => {
        const originalDoc = documentUploadMap.get(fileUpload.refId);

        if (!originalDoc) {
          throw new Error(`Missing document ${fileUpload.refId}`);
        }

        return uploadFileToS3WithPresignedPost({
          presignedPost: {
            url: fileUpload.url,
            fields: fileUpload.fields as Record<string, string>,
            key: fileUpload.presignedKey,
          },
          fileUri: originalDoc.uri,
        });
      })
    );

    const documentsToSave = payload.uploads.map((fileUpload) => {
      const originalDoc = documentUploadMap.get(fileUpload.refId);

      if (!originalDoc) {
        throw new Error(`Missing document ${fileUpload.refId}`);
      }

      return {
        presignedKey: fileUpload.presignedKey,
        filename: originalDoc.name,
        contentType: originalDoc.type,
        namespace,
        uploadToken: fileUpload.uploadToken,
      };
    });

    // 5: Persist uploaded documents in backend
    // creates DB records referencing S3 keys
    const resolved = await resolveUploads({
      variables: {
        data: {
          clientProfileId,
          documents: documentsToSave,
        },
      },
      refetchQueries: [
        {
          query: ClientProfileDocument,
          variables: { id: clientProfileId },
        },
      ],
    });

    const resolvePayload = resolved.data?.resolveClientDocumentUploads;

    if (!resolvePayload) {
      throw new Error('Missing resolveUploads response');
    }

    if (resolvePayload.__typename === 'OperationInfo') {
      throw new Error(resolvePayload.messages.map((m) => m.message).join(', '));
    }
  }

  return { uploadDocuments };
}
