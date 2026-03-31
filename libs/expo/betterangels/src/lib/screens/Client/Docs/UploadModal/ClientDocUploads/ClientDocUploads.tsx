import { useMutation } from '@apollo/client/react';
import {
  ReactNativeFile,
  uploadFileToS3WithPresignedPost,
} from '@monorepo/expo/shared/clients';
import { UploadIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { MediaPicker, TextBold } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { ClientDocumentNamespaceEnum } from '../../../../../apollo';
import {
  CreateClientDocumentsFromUploadsDocument,
  CreateClientDocumentUploadsDocument,
} from '../../../__generated__/Client.generated';
import { UploadSection } from '../UploadSection';
import UploadsPreview from '../UploadsPreview';
import { IMultipleDocUploadsProps } from '../types';

function generateUploadRef(index: number): string {
  return `${Date.now()}-${index}`;
}

export function ClientDocUploads(props: IMultipleDocUploadsProps) {
  console.log('################################### ClientDocUploads');

  const { setTab, client, setDocs, docs, title, docType } = props;

  const [processing, setProcessing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  // const { showSnackbar } = useSnackbar();

  const [createUploads] = useMutation(CreateClientDocumentUploadsDocument);
  const [resolveUploads] = useMutation(
    CreateClientDocumentsFromUploadsDocument
  );

  const uploadDocuments = async () => {
    const documents = docs?.[docType];

    if (!documents || documents.length < 1 || !client) {
      return;
    }

    try {
      setProcessing(true);

      console.log(JSON.stringify(documents, null, 2));

      if (!client.clientProfile.id) {
        return;
      }

      const documentUploadMap = new Map<string, ReactNativeFile>();

      const documentUploadInput = documents.map((doc, index) => {
        const refId = generateUploadRef(index);

        documentUploadMap.set(refId, doc);

        return {
          refId,
          filename: doc.name,
          contentType: doc.type,
        };
      });

      const result = await createUploads({
        variables: {
          data: {
            clientProfileId: client.clientProfile.id,
            uploads: documentUploadInput,
          },
        },
      });

      console.log();
      console.log('| -------------  SIG result  ------------- |');
      console.log(JSON.stringify(result, null, 2));
      console.log();

      const payload = result.data?.createClientDocumentUploads;

      if (!payload) {
        throw new Error('Missing response');
      }

      if (payload.__typename === 'OperationInfo') {
        throw new Error(payload.messages.map((m) => m.message).join(', '));
      }

      if (payload.__typename !== 'PresignedS3UploadsResult') {
        throw new Error('Unexpected response type');
      }

      const results = await Promise.all(
        payload.uploads.map((fileUpload) => {
          const originalDoc = documentUploadMap.get(fileUpload.refId);

          if (!originalDoc) {
            throw new Error(
              `cannot find document by refId [${fileUpload.refId}]`
            );
          }

          return uploadFileToS3WithPresignedPost({
            presignedPost: {
              url: fileUpload.url,
              fields: fileUpload.fields as Record<string, string>,
              key: fileUpload.key,
            },
            fileUri: originalDoc.uri,
            fileName: originalDoc.name,
            // contentType: originalDoc.type,
          });
        })
      );

      console.log();
      console.log('| -------------  results  ------------- |');
      console.log(JSON.stringify(results, null, 2));
      console.log();

      const documentsToSave = payload.uploads.map((fileUpload) => {
        const originalDoc = documentUploadMap.get(fileUpload.refId);

        if (!originalDoc) {
          throw new Error(`Missing document for ${fileUpload.refId}`);
        }

        // or whatever we save to DB
        return {
          key: fileUpload.key,
          filename: originalDoc.name,
          contentType: originalDoc.type,
          namespace: ClientDocumentNamespaceEnum[docType],
        };
      });

      console.log();
      console.log('| -------------  documentsToSave  ------------- |');
      console.log(JSON.stringify(documentsToSave, null, 2));
      console.log();

      const resolved = await resolveUploads({
        variables: {
          data: {
            clientProfileId: client.clientProfile.id,
            documents: documentsToSave,
          },
        },
      });

      console.log();
      console.log('| -------------  resolved  ------------- |');
      console.log(JSON.stringify(resolved, null, 2));
      console.log();

      // on save
      // 1. update cache
      // 2. close modal?

      // call mutation with documentsToSave payload
    } catch (err) {
      // show snackbar?
      console.log(err);
    } finally {
      setProcessing(false);
    }
  };

  // const uploadDocuments = async () => {
  //   const documents = docs?.[docType];

  //   if (!documents || documents.length < 1 || !client) {
  //     return;
  //   }

  //   try {
  //     const uploads = documents.map((form) => {
  //       const fileToUpload = new ReactNativeFile({
  //         uri: form.uri,
  //         type: form.type,
  //         name: form.name,
  //       });

  //       return createDocument({
  //         variables: {
  //           data: {
  //             file: fileToUpload,
  //             clientProfile: client.clientProfile.id,
  //             namespace: ClientDocumentNamespaceEnum[docType],
  //           },
  //         },
  //       });
  //     });

  //     await Promise.all(uploads);
  //   } catch (err) {
  //     console.error(`error uploading ${docType} forms: `, err);

  //     showSnackbar({
  //       message: `Sorry, there was an error with the file upload.`,
  //       type: 'error',
  //     });
  //   }

  //   setTab(undefined);
  // };

  const onRemoveFile = (index: number) => {
    setDocs({
      ...docs,
      [docType]: docs[docType]?.filter((_, i) => i !== index),
    });
  };

  const onFilenameChange = (index: number, value: string) => {
    setDocs({
      ...docs,
      [docType]: docs[docType]?.map((file, i) =>
        i === index ? { ...file, name: value } : file
      ),
    });
  };

  const docsToUpload = (docs && docs[docType]) || [];

  const allDocsValid = docsToUpload.every((file) => {
    return !!file.name && !!file.type && !!file.uri;
  });

  return (
    <>
      <UploadSection
        loading={processing}
        disabled={!docsToUpload.length || !allDocsValid}
        title={title}
        onSubmit={uploadDocuments}
        onCancel={() => {
          setDocs({
            ...docs,
            [docType]: [],
          });
          setTab(undefined);
        }}
      >
        <View
          style={{
            padding: Spacings.sm,
            paddingBottom: Spacings.lg,
            marginBottom: Spacings.sm,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottomColor: Colors.NEUTRAL_LIGHT,
            borderBottomWidth: 1,
          }}
        >
          <Pressable
            onPress={() => {
              setIsModalVisible(true);
            }}
            accessibilityRole="button"
            style={{ alignItems: 'center' }}
          >
            <View
              style={{
                flexDirection: 'row',
                gap: Spacings.xs,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: Colors.NEUTRAL_LIGHT,
                borderRadius: Radiuses.xs,
                height: 66,
                width: 139,
              }}
            >
              <UploadIcon size="lg" />
              <TextBold size="sm">Upload</TextBold>
            </View>
          </Pressable>
        </View>

        {docsToUpload.length > 0 && (
          <UploadsPreview
            files={docsToUpload}
            onRemoveFile={onRemoveFile}
            onFilenameChange={onFilenameChange}
            documentType={ClientDocumentNamespaceEnum[docType]}
          />
        )}
      </UploadSection>

      <MediaPicker
        allowMultiple={true}
        isOpen={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onCameraCapture={(file) => {
          setDocs({
            ...docs,
            [docType]: [...(docs[docType] ?? []), file],
          });
        }}
        onFilesSelected={(files) => {
          setDocs({
            ...docs,
            [docType]: [...(docs[docType] ?? []), ...files],
          });
        }}
      />
    </>
  );
}
