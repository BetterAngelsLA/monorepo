import { gql, useMutation } from '@apollo/client';
import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { CameraIcon } from '@monorepo/expo/shared/icons';
import { useCameraPermissions } from 'expo-camera';
import { Dispatch, SetStateAction, useState } from 'react';
import { Alert, Modal } from 'react-native';
import Camera from '../Camera';
import IconButton from '../IconButton';

interface IImage {
  id: string | undefined;
  uri: string;
  loading?: boolean;
  abortController?: AbortController;
}
interface IInteractionCameraProps {
  setImages: Dispatch<SetStateAction<IImage[] | undefined>>;
  namespace: string;
  noteId: string | undefined;
  setIsLoading: (isLoading: boolean) => void;
  isLoading: boolean;
}

export default function InteractionCamera(props: IInteractionCameraProps) {
  const { setImages, namespace, noteId, setIsLoading, isLoading } = props;
  const [permission, requestPermission] = useCameraPermissions();
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

  const captureImage = async (file: ReactNativeFile) => {
    if (!noteId || isLoading) return;
    setIsLoading(true);
    try {
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
        setImages((prevState: IImage[] | undefined) => {
          if (prevState) {
            return [
              ...prevState,
              { uri: file.uri, id: data.createNoteAttachment.id },
            ];
          }
          return [{ uri: file.uri, id: data.createNoteAttachment.id }];
        });
      }

      setIsCameraOpen(false);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      console.error(err);
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

  if (isCameraOpen) {
    return (
      <Modal>
        <Camera
          onCapture={captureImage}
          setIsCameraOpen={setIsCameraOpen}
          setModalVisible={setIsCameraOpen}
        />
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
      <CameraIcon size="md" />
    </IconButton>
  );
}
