import { ReactNativeFile } from '@monorepo/expo/shared/apollo';
import { PlusIcon, UploadIcon } from '@monorepo/expo/shared/icons';
import { Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  IconButton,
  LibraryModal,
  TextBold,
} from '@monorepo/expo/shared/ui-components';
import { Dispatch, SetStateAction, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { ClientDocumentNamespaceEnum } from '../../../../../apollo';
import {
  ClientProfileDocument,
  ClientProfileQuery,
  useCreateClientDocumentMutation,
} from '../../../__generated__/Client.generated';
import Section from '../Section';
import { Docs, ITab } from '../types';

export default function BirthCertificate({
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
  const [isModalVisible, setIsModalVisible] = useState(false);
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
    if (!docs?.birthCertificate || !client) {
      return;
    }

    const fileToUploadFront = new ReactNativeFile({
      uri: docs.birthCertificate.uri,
      type: docs.birthCertificate.type,
      name: docs.birthCertificate.name,
    });

    await createDocument({
      variables: {
        data: {
          file: fileToUploadFront,
          clientProfile: client.clientProfile.id,
          namespace: ClientDocumentNamespaceEnum.BirthCertificate,
        },
      },
    });
    setTab(undefined);
  };

  const onDelete = () => {
    setDocs({
      ...docs,
      birthCertificate: undefined,
    });
  };

  return (
    <>
      <Section
        loading={loading}
        title="Upload Birth Certificate"
        onSubmit={uploadDocument}
        onCancel={() => {
          setDocs({
            ...docs,
            birthCertificate: undefined,
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
        {docs.birthCertificate && (
          <View style={{ paddingTop: Spacings.sm }}>
            <TextBold mb="sm" size="md">
              Uploaded Image
            </TextBold>
            <View style={{ marginBottom: Spacings.md }}>
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
                    height: 395,
                    width: 236,
                  }}
                  source={{ uri: docs.birthCertificate.uri }}
                  resizeMode="cover"
                  accessibilityIgnoresInvertColors
                />
              </View>
              <BasicInput
                label="File Name"
                value={docs.birthCertificate.name}
                onChangeText={(e) =>
                  setDocs({
                    ...docs,
                    birthCertificate: {
                      ...docs.birthCertificate,
                      name: e,
                      uri: docs.birthCertificate?.uri || '',
                      type: docs.birthCertificate?.type || '',
                    },
                  })
                }
              />
            </View>
          </View>
        )}
      </Section>
      <LibraryModal
        onCapture={(file) => {
          setDocs({
            ...docs,
            birthCertificate: file,
          });
        }}
        allowMultiple={false}
        setModalVisible={setIsModalVisible}
        isModalVisible={isModalVisible}
        setFiles={(files) => {
          setDocs({
            ...docs,
            birthCertificate: files[0],
          });
        }}
      />
    </>
  );
}
