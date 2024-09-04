import { ReactNativeFile } from '@monorepo/expo/shared/apollo';
import { PlusIcon, UploadIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  IconButton,
  LibraryModal,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { Dispatch, SetStateAction, useState } from 'react';
import { Image, Pressable, Switch, View } from 'react-native';
import { ClientDocumentNamespaceEnum } from '../../../../../apollo';
import {
  ClientProfileDocument,
  ClientProfileQuery,
  useCreateClientDocumentMutation,
} from '../../../__generated__/Client.generated';
import Section from '../Section';
import { Docs, ITab } from '../types';

export default function DriverLicense({
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
  const [isCaLicense, setIsCaLicense] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [uploadingType, setUploadingType] = useState<'front' | 'back'>('front');
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
    if (!docs?.driverLicenseFront || !docs.driverLicenseBack || !client) {
      return;
    }
    const fileToUploadFront = new ReactNativeFile({
      uri: docs.driverLicenseFront.uri,
      type: docs.driverLicenseFront.type,
      name: docs.driverLicenseFront.name,
    });

    const fileToUploadBack = new ReactNativeFile({
      uri: docs.driverLicenseBack.uri,
      type: docs.driverLicenseBack.type,
      name: docs.driverLicenseBack.name,
    });

    try {
      await Promise.all([
        createDocument({
          variables: {
            data: {
              file: fileToUploadFront,
              clientProfile: client.clientProfile.id,
              namespace: ClientDocumentNamespaceEnum.DriversLicenseFront,
            },
          },
        }),
        createDocument({
          variables: {
            data: {
              file: fileToUploadBack,
              clientProfile: client.clientProfile.id,
              namespace: ClientDocumentNamespaceEnum.DriversLicenseBack,
            },
          },
        }),
      ]);

      setTab(undefined);
    } catch (err) {
      console.error('error uploading driver license', err);
    }
  };

  const onDelete = (type: 'front' | 'back') => {
    if (type === 'front') {
      setDocs({
        ...docs,
        driverLicenseFront: undefined,
      });
    } else {
      setDocs({
        ...docs,
        driverLicenseBack: undefined,
      });
    }
  };

  return (
    <>
      <Section
        loading={loading}
        title="Upload Driver's License"
        subtitle="You need to upload front and back of the license."
        onSubmit={uploadDocument}
        onCancel={() => {
          setDocs({
            ...docs,
            driverLicenseFront: undefined,
            driverLicenseBack: undefined,
          });
          setTab(undefined);
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: Spacings.md,
            paddingBottom: Spacings.sm,
            marginBottom: Spacings.sm,
          }}
        >
          <TextRegular>Is this a CA Driver's License?</TextRegular>

          <Switch
            value={isCaLicense}
            onChange={() => setIsCaLicense(!isCaLicense)}
          />
        </View>
        <View
          style={{
            padding: Spacings.sm,
            paddingBottom: Spacings.lg,
            marginBottom: Spacings.sm,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: Spacings.sm,
            borderBottomColor: Colors.NEUTRAL_LIGHT,
            borderBottomWidth: 1,
          }}
        >
          <Pressable
            onPress={() => {
              setUploadingType('front');
              setIsModalVisible(true);
            }}
            accessibilityRole="button"
            style={{ alignItems: 'center' }}
          >
            <TextRegular mb="xs" size="sm">
              Front
            </TextRegular>
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
          <Pressable
            onPress={() => {
              setUploadingType('back');
              setIsModalVisible(true);
            }}
            accessibilityRole="button"
            style={{ alignItems: 'center' }}
          >
            <TextRegular mb="xs" size="sm">
              Back
            </TextRegular>
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
        {(docs?.driverLicenseFront || docs?.driverLicenseBack) && (
          <View style={{ paddingTop: Spacings.sm }}>
            <TextBold mb="sm" size="md">
              Uploaded Image
            </TextBold>
            {docs.driverLicenseFront && (
              <View style={{ marginBottom: Spacings.md, position: 'relative' }}>
                <TextBold size="sm">Front</TextBold>
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
                    onPress={() => onDelete('front')}
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
                    source={{ uri: docs.driverLicenseFront.uri }}
                    resizeMode="cover"
                    accessibilityIgnoresInvertColors
                  />
                </View>
                <BasicInput
                  label="File Name"
                  value={docs.driverLicenseFront.name}
                  onChangeText={(e) =>
                    setDocs({
                      ...docs,
                      driverLicenseFront: {
                        ...docs.driverLicenseFront,
                        name: e,
                        uri: docs.driverLicenseFront?.uri || '',
                        type: docs.driverLicenseFront?.type || '',
                      },
                    })
                  }
                />
              </View>
            )}
            {docs.driverLicenseBack && (
              <View>
                <TextBold size="sm">Back</TextBold>
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
                    onPress={() => onDelete('back')}
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
                    source={{ uri: docs.driverLicenseBack.uri }}
                    resizeMode="cover"
                    accessibilityIgnoresInvertColors
                  />
                </View>
                <BasicInput
                  label="File Name"
                  value={docs.driverLicenseBack.name}
                  onChangeText={(e) =>
                    setDocs({
                      ...docs,
                      driverLicenseBack: {
                        ...docs.driverLicenseBack,
                        name: e,
                        uri: docs.driverLicenseBack?.uri || '',
                        type: docs.driverLicenseBack?.type || '',
                      },
                    })
                  }
                />
              </View>
            )}
          </View>
        )}
      </Section>
      <LibraryModal
        allowMultiple={false}
        onCapture={(file) => {
          if (uploadingType === 'front') {
            setDocs({
              ...docs,
              driverLicenseFront: file,
            });
          } else {
            setDocs({
              ...docs,
              driverLicenseBack: file,
            });
          }
        }}
        setModalVisible={setIsModalVisible}
        isModalVisible={isModalVisible}
        setFiles={(files) => {
          if (uploadingType === 'front') {
            setDocs({
              ...docs,
              driverLicenseFront: files[0],
            });
          } else {
            setDocs({
              ...docs,
              driverLicenseBack: files[0],
            });
          }
        }}
      />
    </>
  );
}
