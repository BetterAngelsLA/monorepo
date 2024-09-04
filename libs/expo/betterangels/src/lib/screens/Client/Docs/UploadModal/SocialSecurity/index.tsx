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

export default function SocialSecurity({
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
    if (!docs?.ssn || !client) {
      return;
    }

    const fileToUpload = new ReactNativeFile({
      uri: docs.ssn.uri,
      type: docs.ssn.type,
      name: docs.ssn.name,
    });

    await createDocument({
      variables: {
        data: {
          file: fileToUpload,
          clientProfile: client.clientProfile.id,
          namespace: ClientDocumentNamespaceEnum.SocialSecurityCard,
        },
      },
    });
    setTab(undefined);
  };

  const onDelete = () => {
    setDocs({
      ...docs,
      ssn: undefined,
    });
  };

  return (
    <>
      <Section
        loading={loading}
        title="Upload Social Security Card"
        onSubmit={uploadDocument}
        onCancel={() => {
          setDocs({
            ...docs,
            ssn: undefined,
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
        {docs.ssn && (
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
                    marginBottom: Spacings.sm,
                  }}
                  source={{ uri: docs.ssn.uri }}
                  resizeMode="cover"
                  accessibilityIgnoresInvertColors
                />
              </View>
              <BasicInput
                label="File Name"
                value={docs.ssn.name}
                onChangeText={(e) =>
                  setDocs({
                    ...docs,
                    ssn: {
                      ...docs.ssn,
                      name: e,
                      uri: docs.ssn?.uri || '',
                      type: docs.ssn?.type || '',
                    },
                  })
                }
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
            ssn: file,
          });
        }}
        setModalVisible={setIsModalVisible}
        isModalVisible={isModalVisible}
        setFiles={(files) => {
          setDocs({
            ...docs,
            ssn: files[0],
          });
        }}
      />
    </>
  );
}
