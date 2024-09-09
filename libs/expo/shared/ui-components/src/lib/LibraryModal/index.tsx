import { ReactNativeFile } from '@monorepo/expo/shared/apollo';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { resizeImage } from '@monorepo/expo/shared/utils';
import { useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import Modal from 'react-native-modal';
import LibCamera from '../Camera';
import TextBold from '../TextBold';
import TextRegular from '../TextRegular';

interface ILibraryModalProps {
  onCapture: (file: ReactNativeFile) => void;
  setModalVisible: (isModalVisible: boolean) => void;
  isModalVisible: boolean;
  setFiles: (files: ReactNativeFile[]) => void;
  allowMultiple?: boolean;
}

export default function LibraryModal(props: ILibraryModalProps) {
  const {
    onCapture,
    setModalVisible,
    isModalVisible,
    setFiles,
    allowMultiple = true,
  } = props;
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();

  const closeModal = () => {
    setModalVisible(false);
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

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        allowsMultipleSelection: allowMultiple,
      });

      if (!result.canceled && result.assets) {
        const uploadPromises = result.assets.map(async (asset) => {
          const resizedPhoto = await resizeImage({ uri: asset.uri });
          const file = new ReactNativeFile({
            uri: resizedPhoto.uri,
            name: asset?.fileName || Date.now().toString(),
            type: asset.mimeType || 'image/jpeg',
          });

          return file;
        });

        const uploadedImages = await Promise.all(uploadPromises);

        setFiles(uploadedImages);
        setModalVisible(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropOpacity={0.5}
      onBackdropPress={closeModal}
      isVisible={isModalVisible}
      style={{ justifyContent: 'flex-end', margin: isCameraOpen ? 0 : 20 }}
      useNativeDriverForBackdrop={true}
    >
      {isCameraOpen ? (
        <LibCamera
          setModalVisible={setModalVisible}
          setIsCameraOpen={setIsCameraOpen}
          onCapture={onCapture}
        />
      ) : (
        <>
          <View
            style={{
              backgroundColor: Colors.WHITE,
              marginBottom: Spacings.xs,
              borderRadius: 8,
              shadowColor: Colors.BLACK,
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          >
            <Pressable
              onPress={pickImage}
              style={{
                padding: Spacings.sm,
                alignItems: 'center',
                borderBottomWidth: 0.5,
                borderBottomColor: Colors.NEUTRAL_LIGHT,
              }}
              accessibilityRole="button"
              accessibilityHint="opens photo library"
            >
              <TextRegular color={Colors.PRIMARY}>From Photo Album</TextRegular>
            </Pressable>
            <Pressable
              onPress={getPermissionsAndOpenCamera}
              style={{
                padding: Spacings.sm,
                alignItems: 'center',
                borderTopWidth: 0.5,
                borderTopColor: Colors.NEUTRAL_LIGHT,
              }}
              accessibilityRole="button"
              accessibilityHint="opens camera"
            >
              <TextRegular color={Colors.PRIMARY}>Take Photo</TextRegular>
            </Pressable>
          </View>
          <Pressable
            style={{
              backgroundColor: Colors.WHITE,
              borderRadius: 8,
              padding: Spacings.sm,
              alignItems: 'center',
              shadowColor: Colors.BLACK,
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
            accessibilityRole="button"
            accessibilityHint="close map selection"
            onPress={closeModal}
          >
            <TextBold color={Colors.PRIMARY}>Cancel</TextBold>
          </Pressable>
        </>
      )}
    </Modal>
  );
}
