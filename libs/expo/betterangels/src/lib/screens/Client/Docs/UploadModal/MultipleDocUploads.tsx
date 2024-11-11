import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { PlusIcon, UploadIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  IconButton,
  MediaPickerModal,
  TextBold,
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { ClientDocumentNamespaceEnum } from '../../../../apollo';
import { useSnackbar } from '../../../../hooks';
import {
  ClientProfileDocument,
  useCreateClientDocumentMutation,
} from '../../__generated__/Client.generated';
import Section from './UploadSection';
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

  const onDelete = (index: number) => {
    setDocs({
      ...docs,
      [docType]: docs[docType]?.filter((_, i) => i !== index),
    });
  };

  return (
    <>
      <Section
        loading={loading}
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
        {docs[docType] && docs[docType]!.length > 0 && (
          <View style={{ paddingTop: Spacings.sm }}>
            <TextBold mb="sm" size="md">
              Uploaded Image{docs[docType]!.length > 1 ? 's' : ''}
            </TextBold>
            {docs[docType]!.map((formImage, index) => (
              <View key={index} style={{ marginBottom: Spacings.md }}>
                <View
                  style={{
                    position: 'relative',
                    height: 395,
                    width: 236,
                    marginBottom: Spacings.sm,
                  }}
                >
                  <IconButton
                    borderColor="transparent"
                    borderRadius={Radiuses.xxxl}
                    onPress={() => onDelete(index)}
                    style={{
                      position: 'absolute',
                      top: 5,
                      right: 5,
                      zIndex: 1000,
                    }}
                    variant="secondary"
                    height="xs"
                    width="xs"
                    accessibilityLabel="delete"
                    accessibilityHint="deletes the image"
                  >
                    <PlusIcon size="sm" rotate="45deg" />
                  </IconButton>
                  <Image
                    style={{
                      height: 395,
                      width: 236,
                    }}
                    source={{ uri: formImage.uri }}
                    resizeMode="cover"
                    accessibilityIgnoresInvertColors
                  />
                </View>
                <BasicInput
                  onDelete={() =>
                    setDocs({
                      ...docs,
                      [docType]: docs[docType]?.map((img, i) =>
                        i === index ? { ...img, name: '' } : img
                      ),
                    })
                  }
                  label="File Name"
                  value={formImage.name}
                  onChangeText={(e) =>
                    setDocs({
                      ...docs,
                      [docType]: docs[docType]?.map((img, i) =>
                        i === index ? { ...img, name: e } : img
                      ),
                    })
                  }
                />
              </View>
            ))}
          </View>
        )}
      </Section>
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
