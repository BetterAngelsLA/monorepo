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

export default function IncomeForms({
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

  const uploadDocuments = async () => {
    if (!docs.incomeForms || docs.incomeForms?.length < 1 || !client) {
      return;
    }

    try {
      const uploads = docs.incomeForms.map((form) => {
        const fileToUploadFront = new ReactNativeFile({
          uri: form.uri,
          type: form.type,
          name: form.name,
        });

        return createDocument({
          variables: {
            data: {
              file: fileToUploadFront,
              clientProfile: client.clientProfile.id,
              namespace: ClientDocumentNamespaceEnum.IncomeForm,
            },
          },
        });
      });

      await Promise.all(uploads);
    } catch (err) {
      console.error('error uploading income forms: ', err);
    }

    setTab(undefined);
  };

  const onDelete = (index: number) => {
    setDocs({
      ...docs,
      incomeForms: docs.incomeForms?.filter((_, i) => i !== index),
    });
  };

  return (
    <>
      <Section
        loading={loading}
        title="Upload Income Forms (pay stubs)"
        onSubmit={uploadDocuments}
        onCancel={() => {
          setDocs({
            ...docs,
            incomeForms: [],
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
        {docs.incomeForms && docs.incomeForms.length > 0 && (
          <View style={{ paddingTop: Spacings.sm }}>
            <TextBold mb="sm" size="md">
              Uploaded Image{docs.incomeForms.length > 1 ? 's' : ''}
            </TextBold>
            {docs.incomeForms.map((formImage, index) => (
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
                  label="File Name"
                  value={formImage.name}
                  onChangeText={(e) =>
                    setDocs({
                      ...docs,
                      incomeForms: docs.incomeForms?.map((img, i) =>
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
      <LibraryModal
        onCapture={(file) => {
          setDocs({
            ...docs,
            incomeForms: docs.incomeForms
              ? [...docs.incomeForms, file]
              : [file],
          });
        }}
        setModalVisible={setIsModalVisible}
        isModalVisible={isModalVisible}
        setFiles={(files) => {
          setDocs({
            ...docs,
            incomeForms: docs.incomeForms
              ? [...docs.incomeForms, ...files]
              : [...files],
          });
        }}
      />
    </>
  );
}
