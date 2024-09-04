import { ReactNativeFile } from '@monorepo/expo/shared/apollo';
import { PlusIcon, UploadIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  IconButton,
  LibraryModal,
  TextBold,
} from '@monorepo/expo/shared/ui-components';
import { Dispatch, SetStateAction, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { ClientDocumentNamespaceEnum } from '../../../../../apollo';
import {
  ClientProfileDocument,
  ClientProfileQuery,
  useCreateClientDocumentMutation,
} from '../../../__generated__/Client.generated';
import Section from '../Section';
import { Docs, ITab } from '../types';

export default function PhotoId({
  setTab,
  client,
  setDocs,
  docs,
}: {
  setTab: (tab: ITab) => void;
  client: ClientProfileQuery | undefined;
  docs: Docs;
  setDocs: Dispatch<SetStateAction<Docs>>;
}) {
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
    if (!docs?.photoId || !client) {
      return;
    }

    const fileToUpload = new ReactNativeFile({
      uri: docs.photoId.uri,
      type: docs.photoId.type,
      name: docs.photoId.name,
    });

    await createDocument({
      variables: {
        data: {
          file: fileToUpload,
          clientProfile: client.clientProfile.id,
          namespace: ClientDocumentNamespaceEnum.PhotoId,
        },
      },
    });
    setTab(undefined);
  };

  const onDelete = () => {
    setDocs({
      ...docs,
      photoId: undefined,
    });
  };

  return (
    <>
      <Section
        loading={loading}
        title="Upload Photo ID"
        onSubmit={uploadDocument}
        onCancel={() => {
          setDocs({
            ...docs,
            photoId: undefined,
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
        {docs.photoId && (
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
                  source={{ uri: docs.photoId?.uri }}
                  resizeMode="cover"
                  accessibilityIgnoresInvertColors
                />
              </View>
              <BasicInput
                label="File Name"
                value={docs.photoId?.name || ''}
                onChangeText={(e) => {
                  const updatedPhotoId = {
                    ...docs.photoId,
                    name: e,
                    uri: docs.photoId?.uri || '', // Ensure it's a string
                    type: docs.photoId?.type || '', // Ensure it's a string
                  };

                  console.log('Updated photoId object:', updatedPhotoId);

                  setDocs((prevDocs) => ({
                    ...prevDocs,
                    photoId: updatedPhotoId,
                  }));
                }}
              />
            </View>
          </View>
        )}
      </Section>
      <LibraryModal
        allowMultiple={false}
        onCapture={(file) => {
          setDocs({
            ...docs,
            photoId: file,
          });
        }}
        setModalVisible={setIsModalVisible}
        isModalVisible={isModalVisible}
        setFiles={(files) => {
          setDocs({
            ...docs,
            photoId: files[0],
          });
        }}
      />
    </>
  );
}
