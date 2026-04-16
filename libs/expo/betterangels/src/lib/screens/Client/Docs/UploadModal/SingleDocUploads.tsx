import { useMutation } from '@apollo/client/react';
import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { UploadIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { MediaPicker, TextBold } from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { ClientDocumentNamespaceEnum } from '../../../../apollo';
import { useSnackbar } from '../../../../hooks';
import {
  ClientProfileDocument,
  CreateClientDocumentDocument,
} from '../../__generated__/Client.generated';
import { UploadSection } from './UploadSection';
import UploadsPreview from './UploadsPreview';
import { ISingleDocUploadsProps } from './types';

export default function SingleDocUploads(props: ISingleDocUploadsProps) {
  const {
    setTab,
    client,
    setDocs,
    docs,
    title,
    docType,
    closeModal,
    onUploadSuccess,
    onUploadError,
  } = props;
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { showSnackbar } = useSnackbar();
  const [createDocument, { loading }] = useMutation(
    CreateClientDocumentDocument,
    {
      refetchQueries: [
        {
          query: ClientProfileDocument,
          variables: {
            id: client?.clientProfile.id,
          },
        },
      ],
    }
  );

  useEffect(() => {
    setIsModalVisible(true);
  }, []);

  const uploadDocument = async () => {
    const document = docs?.[docType];

    if (!document || !client) {
      return;
    }

    try {
      const fileToUpload = new ReactNativeFile({
        uri: document.uri,
        type: document.type,
        name: document.name,
      });

      await createDocument({
        variables: {
          data: {
            file: fileToUpload,
            clientProfile: client.clientProfile.id,
            namespace: ClientDocumentNamespaceEnum[docType],
          },
        },
      });

      onUploadSuccess?.('File uploaded successfully.');
      closeModal();
    } catch (err) {
      console.error(`error uploading ${docType} forms: `, err);

      onUploadError?.('Upload failed. Please try again.');
      closeModal();

      showSnackbar({
        message: `Sorry, there was an error updating the file.`,
        type: 'error',
      });
    }

    setTab(undefined);
  };

  const onRemoveFile = (_idx: number) => {
    setDocs({
      ...docs,
      [docType]: undefined,
    });
  };

  const onFilenameChange = (_idx: number, value: string) => {
    setDocs({
      ...docs,
      [docType]: {
        ...docs[docType],
        name: value,
      },
    });
  };

  const documentToUpload = docs && docs[docType];

  const documentValid =
    !!documentToUpload &&
    !!documentToUpload.name &&
    !!documentToUpload.type &&
    !!documentToUpload.uri;

  return (
    <View style={{ flex: 1 }}>
      <UploadSection
        loading={loading}
        disabled={!documentValid}
        title={title}
        onSubmit={uploadDocument}
        onCancel={() => {
          setDocs({
            ...docs,
            [docType]: undefined,
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
            style={({ pressed }) => [{
              alignItems: 'center',
              flexDirection: 'row',
              gap: Spacings.xs,
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: Colors.NEUTRAL_LIGHT,
              borderRadius: Radiuses.xs,
              height: 66,
              width: 139,
              backgroundColor: pressed ? Colors.GRAY_PRESSED : 'transparent',
            }]}
          >
            <UploadIcon size="lg" />
            <TextBold size="sm">Upload</TextBold>
          </Pressable>
        </View>

        {documentToUpload && (
          <UploadsPreview
            files={[documentToUpload]}
            onRemoveFile={onRemoveFile}
            onFilenameChange={onFilenameChange}
            documentType={ClientDocumentNamespaceEnum[docType]}
          />
        )}
      </UploadSection>

      <MediaPicker
        allowMultiple={false}
        isOpen={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onCameraCapture={(file) => {
          setDocs({
            ...docs,
            [docType]: file,
          });
        }}
        onFilesSelected={(files) => {
          setDocs({
            ...docs,
            [docType]: files[0],
          });
        }}
      />
    </View>
  );
}
