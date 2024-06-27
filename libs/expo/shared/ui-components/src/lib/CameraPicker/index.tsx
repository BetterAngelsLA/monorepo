import { gql, useMutation } from '@apollo/client';
import { ReactNativeFile } from '@monorepo/expo/shared/apollo';
import {
  BoltIcon,
  BoltSlashIcon,
  CameraIcon,
  CameraRotateIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { resizeImage } from '@monorepo/expo/shared/utils';
import {
  CameraType,
  CameraView,
  FlashMode,
  useCameraPermissions,
} from 'expo-camera';
import { useRef, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';
import IconButton from '../IconButton';
import TextButton from '../TextButton';
import TextMedium from '../TextMedium';
interface ICameraPickerProps {
  images: { id: string | undefined; uri: string }[];
  setImages: (images: { id: string | undefined; uri: string }[]) => void;
  namespace: string;
  noteId: string | undefined;
  setIsLoading: (isLoading: boolean) => void;
  isLoading: boolean;
}

export default function CameraPicker(props: ICameraPickerProps) {
  const { setImages, images, namespace, noteId, setIsLoading, isLoading } =
    props;
  const [permission, requestPermission] = useCameraPermissions();
  const [type, setType] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [createNoteAttachment, { error }] = useMutation(gql`
    mutation CreateNoteAttachment(
      $noteId: ID!
      $namespace: NoteNamespaceEnum!
      $file: Upload!
    ) {
      createNoteAttachment(
        data: { note: $noteId, namespace: $namespace, file: $file }
      ) {
        ... on OperationInfo {
          messages {
            kind
            field
            message
          }
        }
        ... on NoteAttachmentType {
          id
          attachmentType
          file {
            name
          }
          originalFilename
          namespace
        }
      }
    }
  `);

  const cameraRef = useRef<CameraView | null>(null);

  const captureImage = async () => {
    if (!noteId || !cameraRef.current || isLoading) return;
    setIsLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync();
      if (photo) {
        const resizedPhoto = await resizeImage({ uri: photo.uri });
        const file = new ReactNativeFile({
          uri: resizedPhoto.uri,
          name: `${Date.now().toString()}.jpg`,
          type: 'image/jpeg',
        });
        const { data } = await createNoteAttachment({
          variables: {
            namespace,
            file: file,
            noteId,
          },
        });
        if (!data) {
          console.error('Error creating attachment', error);
          return;
        }
        if ('id' in data.createNoteAttachment) {
          setImages([
            ...images,
            { uri: photo.uri, id: data.createNoteAttachment.id },
          ]);
        }
      }
      setIsCameraOpen(false);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      console.log(err);
    }
  };

  const getPermissionsAndOpenCamera = async () => {
    if (isLoading) return;
    if (permission) {
      const { granted } = await requestPermission();
      if (granted) {
        setIsCameraOpen(true);
      } else {
        Alert.alert(
          'Permission Denied',
          'You need to grant camera permission to use this app'
        );
      }
    }
  };

  const closeCamera = () => {
    setIsCameraOpen(false);
  };

  const toggleFlashLight = () => {
    setFlash((current) => (current === 'off' ? 'on' : 'off'));
  };

  const toggleCameraType = () => {
    setType((current) => (current === 'back' ? 'front' : 'back'));
  };

  if (isCameraOpen) {
    return (
      <Modal>
        <View
          style={{
            flex: 1,
            backgroundColor: Colors.BLACK,
            justifyContent: 'center',
          }}
        >
          {flash === 'off' ? (
            <IconButton
              onPress={toggleFlashLight}
              accessibilityLabel="flash"
              accessibilityHint="enables flash"
              variant="transparent"
            >
              <BoltSlashIcon size="lg" color={Colors.WHITE} />
            </IconButton>
          ) : (
            <IconButton
              onPress={toggleFlashLight}
              accessibilityLabel="flash"
              accessibilityHint="disables flash"
              variant="transparent"
            >
              <BoltIcon color={Colors.WHITE} />
            </IconButton>
          )}
        </View>
        <View style={{ flex: 5 }}>
          <CameraView
            style={styles.camera}
            facing={type}
            flash={flash}
            ref={cameraRef}
          />
        </View>
        <View
          style={{
            flex: 2,
            backgroundColor: Colors.BLACK,
            paddingTop: Spacings.xs,
            paddingHorizontal: Spacings.md,
          }}
        >
          <TextMedium
            textAlign="center"
            mb="md"
            size="sm"
            color={Colors.WARNING}
          >
            PHOTO
          </TextMedium>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <TextButton
              style={{ flex: 1 }}
              color={Colors.WHITE}
              onPress={closeCamera}
              accessibilityHint="closes camera"
              title="Cancel"
            />
            <Pressable
              disabled={isLoading}
              onPress={captureImage}
              style={{ flex: 2, alignItems: 'center' }}
              accessibilityRole="button"
              accessible
              accessibilityLabel="capture"
              accessibilityHint="captures image"
            >
              {({ pressed }) => (
                <View
                  style={{
                    backgroundColor: Colors.BLACK,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 100,
                    borderWidth: 5,
                    borderColor: Colors.WHITE,
                    height: 60,
                    width: 60,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: Colors.WHITE,
                      borderRadius: 100,
                      height: pressed ? 38 : 45,
                      width: pressed ? 38 : 45,
                    }}
                  />
                </View>
              )}
            </Pressable>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <View
                style={{
                  backgroundColor: '#1C1C1C',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 100,
                  height: 41,
                  width: 41,
                }}
              >
                <IconButton
                  onPress={toggleCameraType}
                  accessibilityLabel="change camera"
                  accessibilityHint="toggles front/back camera"
                  variant="transparent"
                >
                  <CameraRotateIcon color={Colors.WHITE} />
                </IconButton>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <IconButton
      disabled={isLoading}
      accessibilityLabel="camera"
      accessibilityHint="opens camera"
      variant="transparent"
      onPress={getPermissionsAndOpenCamera}
    >
      <CameraIcon
        color={isLoading ? Colors.NEUTRAL_LIGHT : Colors.PRIMARY_EXTRA_DARK}
        size="md"
      />
    </IconButton>
  );
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
    width: '100%',
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    marginBottom: 50,
  },
});
