import { ReactNativeFile } from '@monorepo/expo/shared/apollo';
import { UploadIcon } from '@monorepo/expo/shared/icons';
import { Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
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

export default function HmisForms({
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
    if (!docs.hmisForms || docs.hmisForms?.length < 1 || !client) {
      return;
    }

    try {
      const uploads = docs.hmisForms.map((form) => {
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
              namespace: ClientDocumentNamespaceEnum.HmisForm,
            },
          },
        });
      });

      await Promise.all(uploads);
    } catch (err) {
      console.error('error uploading hmis forms: ', err);
    }

    setTab(undefined);
  };

  return (
    <>
      <Section
        loading={loading}
        title="Upload HMIS Form"
        onSubmit={uploadDocuments}
        onCancel={() => {
          setDocs({
            ...docs,
            hmisForms: [],
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
        {docs.hmisForms && docs.hmisForms.length > 0 && (
          <View style={{ paddingTop: Spacings.sm }}>
            <TextBold mb="sm" size="md">
              Uploaded Image{docs.hmisForms.length > 1 ? 's' : ''}
            </TextBold>
            {docs.hmisForms.map((formImage, index) => (
              <View key={index} style={{ marginBottom: Spacings.md }}>
                <Image
                  style={{
                    height: 395,
                    width: 236,
                    marginBottom: Spacings.sm,
                  }}
                  source={{ uri: formImage.uri }}
                  resizeMode="cover"
                  accessibilityIgnoresInvertColors
                />
                <BasicInput
                  label="File Name"
                  value={formImage.name}
                  onChangeText={(e) =>
                    setDocs({
                      ...docs,
                      hmisForms: docs.hmisForms?.map((img, i) =>
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
            hmisForms: docs.hmisForms ? [...docs.hmisForms, file] : [file],
          });
        }}
        setModalVisible={setIsModalVisible}
        isModalVisible={isModalVisible}
        setFiles={(files) => {
          setDocs({
            ...docs,
            hmisForms: docs.hmisForms
              ? [...docs.hmisForms, ...files]
              : [...files],
          });
        }}
      />
    </>
  );
}
