import { gql, useMutation } from '@apollo/client';
import {
  ArrowRotateReverseIcon,
  BoltIcon,
  BoltSlashIcon,
  CameraIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  CameraType,
  CameraView,
  FlashMode,
  useCameraPermissions,
} from 'expo-camera/next';
import { useRef, useState } from 'react';
import { Alert, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import H5 from '../H5';
import IconButton from '../IconButton';
import TextButton from '../TextButton';
interface ICameraPickerProps {
  images: { id: string | undefined; uri: string }[];
  setImages: (e: { id: string | undefined; uri: string }[]) => void;
  namespace: string;
  noteId: string | undefined;
  setIsLoading: (e: boolean) => void;
}

const fetchResourceFromURI = async (uri: string) => {
  const response = await fetch(uri);
  const blob = await response.blob();
  return blob;
};

export default function CameraPicker(props: ICameraPickerProps) {
  const { setImages, images, namespace, noteId, setIsLoading } = props;
  const [permission, requestPermission] = useCameraPermissions();
  const [type, setType] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [createNoteAttachment] = useMutation(gql`
    mutation CreateNoteAttachment($data: CreateNoteAttachmentInput!) {
      createNoteAttachment(data: $data) {
        ... on OperationInfo {
          messages {
            kind
            field
            message
          }
        }
        ... on NoteAttachmentType {
          id
        }
      }
    }
  `);

  const cameraRef = useRef<CameraView | null>(null);

  const captureImage = async () => {
    if (!noteId || !cameraRef.current) return;
    setIsLoading(true);
    try {
      const quality = 0.8;
      const photo = await cameraRef.current.takePictureAsync({ quality });
      if (photo) {
        const file = await fetchResourceFromURI(photo.uri);

        const { data } = await createNoteAttachment({
          variables: {
            data: {
              namespace,
              file,
              note: noteId,
            },
          },
        });
        if (data?.createNoteAttachment.__typename === 'NoteAttachmentType') {
          const createNoteAttachmentId = data?.createNoteAttachment.id;
          if (createNoteAttachmentId) {
            setImages([
              ...images,
              { uri: photo.uri, id: data?.createNoteAttachment.id },
            ]);
          }
        } else if (data?.createNoteAttachment.__typename === 'OperationInfo') {
          console.log(data.createNoteAttachment.messages);
        }
      }
      setIsCameraOpen(false);
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
      console.log(e);
    }
  };

  const getPermissionsAndOpenCamera = async () => {
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
          <H5 textAlign="center" mb="md" size="sm" color={Colors.WARNING}>
            PHOTO
          </H5>
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
            <TouchableOpacity
              onPress={captureImage}
              style={{ flex: 2, alignItems: 'center' }}
              accessibilityRole="button"
              accessible
              accessibilityLabel="capture"
              accessibilityHint="captures image"
            >
              <View
                style={{
                  backgroundColor: Colors.WHITE,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 100,
                  height: 70,
                  width: 70,
                }}
              />
            </TouchableOpacity>
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
                  <ArrowRotateReverseIcon color={Colors.WHITE} />
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
      accessibilityLabel="camera"
      accessibilityHint="opens camera"
      variant="transparent"
      onPress={getPermissionsAndOpenCamera}
    >
      <CameraIcon color={Colors.PRIMARY_EXTRA_DARK} size="md" />
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
