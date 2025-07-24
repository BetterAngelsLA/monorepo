import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { UploadIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  MediaPickerModal,
  TextBold,
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { ClientDocumentNamespaceEnum } from '../../../../apollo';
import { useSnackbar } from '../../../../hooks';
import {
  ClientProfileDocument,
  useCreateClientDocumentMutation,
} from '../../__generated__/Client.generated';
import { UploadSection } from './UploadSection';
import UploadsPreview from './UploadsPreview';
import { IMultipleDocUploadsProps } from './types';

export default function MultipleDocUploads(props: IMultipleDocUploadsProps) {
  const { setTab, client, setDocs, docs, title, docType } = props;
  const [createDocument, { loading }] = useCreateClientDocumentMutation({
    refetchQueries: [
      {
        query: ClientProfileDocument,
        variables: {
          id: client?.clientProfile.id,
        },
      },
    ],
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { showSnackbar } = useSnackbar();

  const uploadDocuments = async () => {
    const documents = docs?.[docType];

    if (!documents || documents.length < 1 || !client) {
      return;
    }

    try {
      const uploads = documents.map((form) => {
        const fileToUpload = new ReactNativeFile({
          uri: form.uri,
          type: form.type,
          name: form.name,
        });

        return createDocument({
          variables: {
            data: {
              file: fileToUpload,
              clientProfile: client.clientProfile.id,
              namespace: ClientDocumentNamespaceEnum[docType],
            },
          },
        });
      });

      await Promise.all(uploads);
    } catch (err) {
      console.error(`error uploading ${docType} forms: `, err);

      showSnackbar({
        message: `Sorry, there was an error with the file upload.`,
        type: 'error',
      });
    }

    setTab(undefined);
  };

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
        loading={loading}
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
      <MediaPickerModal
        onCapture={(file) => {
          setDocs({
            ...docs,
            [docType]: [...(docs[docType] ?? []), file],
          });
        }}
        setModalVisible={setIsModalVisible}
        isModalVisible={isModalVisible}
        setFiles={(files) => {
          setDocs({
            ...docs,
            [docType]: [...(docs[docType] ?? []), ...files],
          });
        }}
      />
    </>
  );
}
