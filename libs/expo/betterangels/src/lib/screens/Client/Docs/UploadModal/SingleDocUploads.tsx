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
import UploadPreview from '../UploadPreview';
import Section from './UploadSection';
import { ISingleDocUploadsProps } from './types';

export default function SingleDocUploads(props: ISingleDocUploadsProps) {
  const { setTab, client, setDocs, docs, title, docType, thumbnailSize } =
    props;
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { showSnackbar } = useSnackbar();
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
    } catch (err) {
      console.error(`error uploading ${docType} forms: `, err);

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
    <>
      <Section
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

        {documentToUpload && (
          <UploadPreview
            files={[documentToUpload]}
            onRemoveFile={onRemoveFile}
            onFilenameChange={onFilenameChange}
            thumbnailSize={thumbnailSize}
          />
        )}
      </Section>
      <MediaPickerModal
        onCapture={(file) => {
          setDocs({
            ...docs,
            [docType]: file,
          });
        }}
        allowMultiple={false}
        setModalVisible={setIsModalVisible}
        isModalVisible={isModalVisible}
        setFiles={(files) => {
          setDocs({
            ...docs,
            [docType]: files[0],
          });
        }}
      />
    </>
  );
}
