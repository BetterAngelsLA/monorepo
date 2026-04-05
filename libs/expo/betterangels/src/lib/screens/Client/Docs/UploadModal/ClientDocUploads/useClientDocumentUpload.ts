import { useMutation } from '@apollo/client/react';
import {
  ReactNativeFile,
  uploadFileToS3WithPresignedPost,
} from '@monorepo/expo/shared/clients';
import { ClientDocumentNamespaceEnum } from '../../../../../apollo';
import {
  GenerateClientDocumentUploadsDocument,
  ResolveClientDocumentUploadsDocument,
} from './__generated__/ClientDocUploads.generated';

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
    // - refId is to correlate server response back to original file
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

    console.log();
    console.log('| -------------  createUploads result  ------------- |');
    console.log(JSON.stringify(result, null, 2));
    console.log();

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
    const uploaded = await Promise.all(
      payload.uploads.map((fileUpload) => {
        const originalDoc = documentUploadMap.get(fileUpload.refId);

        if (!originalDoc) {
          throw new Error(`Missing document ${fileUpload.refId}`);
        }

        return uploadFileToS3WithPresignedPost({
          presignedPost: {
            url: fileUpload.url,
            fields: fileUpload.fields as Record<string, string>,
            key: fileUpload.key,
          },
          fileUri: originalDoc.uri,
          fileName: originalDoc.name,
        });
      })
    );

    console.log();
    console.log('| -------------  uploaded  ------------- |');
    console.log(JSON.stringify(uploaded, null, 2));
    console.log();

    // 4: Build payload for backend persistence
    // - S3 upload is complete at this point
    const documentsToSave = payload.uploads.map((fileUpload) => {
      const originalDoc = documentUploadMap.get(fileUpload.refId);

      if (!originalDoc) {
        throw new Error(`Missing document ${fileUpload.refId}`);
      }

      return {
        key: fileUpload.key,
        filename: originalDoc.name,
        contentType: originalDoc.type,
        namespace,
        signatureKey: fileUpload.signatureKey,
      };
    });

    // 5: Persist uploaded documents in backend
    // - creates DB records referencing S3 keys
    const resolved = await resolveUploads({
      variables: {
        data: {
          clientProfileId,
          documents: documentsToSave,
        },
      },
    });

    console.log();
    console.log('| -------------  resolved  ------------- |');
    console.log(JSON.stringify(resolved, null, 2));
    console.log();

    return resolved;
  }

  return { uploadDocuments };
}
