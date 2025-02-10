import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { PlusIcon, UploadIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  IconButton,
  MediaPickerModal,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { Dispatch, SetStateAction, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { ClientDocumentNamespaceEnum } from '../../../../../apollo';
import useSnackbar from '../../../../../hooks/snackbar/useSnackbar';
import {
  ClientProfileDocument,
  ClientProfileQuery,
  useCreateClientDocumentMutation,
} from '../../../__generated__/Client.generated';
import Section from '../UploadSection';
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
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [uploadingType, setUploadingType] = useState<'front' | 'back'>('front');
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
    if (!docs?.DriversLicenseFront || !client) {
      return;
    }
    const fileToUploadFront = new ReactNativeFile({
      uri: docs.DriversLicenseFront.uri,
      type: docs.DriversLicenseFront.type,
      name: docs.DriversLicenseFront.name,
    });

    const filesToUpload = [
      createDocument({
        variables: {
          data: {
            file: fileToUploadFront,
            clientProfile: client.clientProfile.id,
            namespace: ClientDocumentNamespaceEnum.DriversLicenseFront,
          },
        },
      }),
    ];

    if (docs.DriversLicenseBack) {
      const fileToUploadBack = new ReactNativeFile({
        uri: docs.DriversLicenseBack.uri,
        type: docs.DriversLicenseBack.type,
        name: docs.DriversLicenseBack.name,
      });

      filesToUpload.push(
        createDocument({
          variables: {
            data: {
              file: fileToUploadBack,
              clientProfile: client.clientProfile.id,
              namespace: ClientDocumentNamespaceEnum.DriversLicenseBack,
            },
          },
        })
      );
    }

    try {
      await Promise.all(filesToUpload);
      setTab(undefined);
    } catch (err) {
      console.error('error uploading driver license', err);

      showSnackbar({
        message: `Sorry, there was an error with the file upload.`,
        type: 'error',
      });
    }
  };

  const onDelete = (type: 'front' | 'back') => {
    if (type === 'front') {
      setDocs({
        ...docs,
        DriversLicenseFront: undefined,
      });
    } else {
      setDocs({
        ...docs,
        DriversLicenseBack: undefined,
      });
    }
  };

  return (
    <>
      <Section
        loading={loading}
        title="Upload CA ID or CA Driver’s License"
        onSubmit={uploadDocument}
        onCancel={() => {
          setDocs({
            ...docs,
            DriversLicenseFront: undefined,
            DriversLicenseBack: undefined,
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
        {(docs?.DriversLicenseFront || docs?.DriversLicenseBack) && (
          <View style={{ paddingTop: Spacings.sm }}>
            <TextBold mb="sm" size="md">
              Uploaded Image
            </TextBold>
            {docs.DriversLicenseFront && (
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
                    source={{ uri: docs.DriversLicenseFront.uri }}
                    resizeMode="cover"
                    accessibilityIgnoresInvertColors
                  />
                </View>
                <BasicInput
                  label="File Name"
                  value={docs.DriversLicenseFront.name}
                  onDelete={() =>
                    setDocs({
                      ...docs,
                      DriversLicenseFront: {
                        ...docs.DriversLicenseFront,
                        name: '',
                        uri: docs.DriversLicenseFront?.uri || '',
                        type: docs.DriversLicenseFront?.type || '',
                      },
                    })
                  }
                  onChangeText={(e) =>
                    setDocs({
                      ...docs,
                      DriversLicenseFront: {
                        ...docs.DriversLicenseFront,
                        name: e,
                        uri: docs.DriversLicenseFront?.uri || '',
                        type: docs.DriversLicenseFront?.type || '',
                      },
                    })
                  }
                />
              </View>
            )}
            {docs.DriversLicenseBack && (
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
                    source={{ uri: docs.DriversLicenseBack.uri }}
                    resizeMode="cover"
                    accessibilityIgnoresInvertColors
                  />
                </View>
                <BasicInput
                  label="File Name"
                  value={docs.DriversLicenseBack.name}
                  onDelete={() =>
                    setDocs({
                      ...docs,
                      DriversLicenseBack: {
                        ...docs.DriversLicenseBack,
                        name: '',
                        uri: docs.DriversLicenseBack?.uri || '',
                        type: docs.DriversLicenseBack?.type || '',
                      },
                    })
                  }
                  onChangeText={(e) =>
                    setDocs({
                      ...docs,
                      DriversLicenseBack: {
                        ...docs.DriversLicenseBack,
                        name: e,
                        uri: docs.DriversLicenseBack?.uri || '',
                        type: docs.DriversLicenseBack?.type || '',
                      },
                    })
                  }
                />
              </View>
            )}
          </View>
        )}
      </Section>
      <MediaPickerModal
        allowMultiple={false}
        onCapture={(file) => {
          if (uploadingType === 'front') {
            setDocs({
              ...docs,
              DriversLicenseFront: file,
            });
          } else {
            setDocs({
              ...docs,
              DriversLicenseBack: file,
            });
          }
        }}
        setModalVisible={setIsModalVisible}
        isModalVisible={isModalVisible}
        setFiles={(files) => {
          if (uploadingType === 'front') {
            setDocs({
              ...docs,
              DriversLicenseFront: files[0],
            });
          } else {
            setDocs({
              ...docs,
              DriversLicenseBack: files[0],
            });
          }
        }}
      />
    </>
  );
}
