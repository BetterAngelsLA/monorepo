import { ReactNativeFile } from '@monorepo/expo/shared/apollo';
import { UploadIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
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

export default function ConsentForms({
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
    if (!docs.consentForms || docs.consentForms?.length < 1 || !client) {
      return;
    }

    try {
      const uploads = docs.consentForms.map((form) => {
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
              namespace: ClientDocumentNamespaceEnum.ConsentForm,
            },
          },
        });
      });

      await Promise.all(uploads);
    } catch (err) {
      console.error('error uploading consent forms: ', err);
    }

    setTab(undefined);
  };

  return (
    <>
      <Section
        loading={loading}
        title="Upload Consent Forms"
        onSubmit={uploadDocuments}
        onCancel={() => {
          setDocs({
            ...docs,
            consentForms: [],
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
        {docs.consentForms && docs.consentForms.length > 0 && (
          <View style={{ paddingTop: Spacings.sm }}>
            <TextBold mb="sm" size="md">
              Uploaded Image{docs.consentForms.length > 1 ? 's' : ''}
            </TextBold>
            {docs.consentForms.map((formImage, index) => (
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
                      consentForms: docs.consentForms?.map((img, i) =>
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
            consentForms: docs.consentForms
              ? [...docs.consentForms, file]
              : [file],
          });
        }}
        setModalVisible={setIsModalVisible}
        isModalVisible={isModalVisible}
        setFiles={(files) => {
          setDocs({
            ...docs,
            consentForms: docs.consentForms
              ? [...docs.consentForms, ...files]
              : [...files],
          });
        }}
      />
    </>
  );
}
