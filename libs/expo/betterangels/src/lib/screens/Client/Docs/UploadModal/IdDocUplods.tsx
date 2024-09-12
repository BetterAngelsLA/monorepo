import { ReactNativeFile } from '@monorepo/expo/shared/apollo';
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
import {
  ClientProfileDocument,
  useCreateClientDocumentMutation,
} from '../../__generated__/Client.generated';
import Section from './UploadSection';
import { IIdDocUploadsProps } from './types';

export default function IdDocUploads(props: IIdDocUploadsProps) {
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

  const uploadDocument = async () => {
    if (!docs?.[docType] || !client) {
      return;
    }
    try {
      const fileToUpload = new ReactNativeFile({
        uri: docs[docType]!.uri,
        type: docs[docType]!.type,
        name: docs[docType]!.name,
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
      setTab(undefined);
    } catch (err) {
      console.error(`error uploading ${docType} forms: `, err);
    }
  };

  const onDelete = () => {
    setDocs({
      ...docs,
      [docType]: undefined,
    });
  };

  return (
    <>
      <Section
        loading={loading}
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
        {docs[docType] && (
          <View style={{ paddingTop: Spacings.sm }}>
            <TextBold mb="sm" size="md">
              Uploaded Image
            </TextBold>
            <View style={{ marginBottom: Spacings.md }}>
              <View
                style={{
                  position: 'relative',
                  height: 86.5,
                  width: 129,
                  marginBottom: Spacings.sm,
                }}
              >
                <IconButton
                  borderColor="transparent"
                  borderRadius={Radiuses.xxxl}
                  onPress={() => onDelete()}
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
                    height: 86.5,
                    width: 129,
                    borderRadius: Radiuses.xs,
                  }}
                  source={{ uri: docs?.[docType]?.uri }}
                  resizeMode="cover"
                  accessibilityIgnoresInvertColors
                />
              </View>
              <BasicInput
                label="File Name"
                value={docs?.[docType]?.name || ''}
                onChangeText={(e) => {
                  const updated = {
                    ...docs[docType],
                    name: e,
                    uri: docs[docType]?.uri || '',
                    type: docs[docType]?.type || '',
                  };

                  setDocs((prevDocs) => ({
                    ...prevDocs,
                    [docType]: updated,
                  }));
                }}
              />
            </View>
          </View>
        )}
      </Section>
      <MediaPickerModal
        allowMultiple={false}
        onCapture={(file) => {
          setDocs({
            ...docs,
            [docType]: file,
          });
        }}
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
