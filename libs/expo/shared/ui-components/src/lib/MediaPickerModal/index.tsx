import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import {
  Colors,
  MimeTypes,
  Shadow,
  Spacings,
} from '@monorepo/expo/shared/static';
import { BaseModal } from '@monorepo/expo/shared/ui-components';
import { resizeImage } from '@monorepo/expo/shared/utils';
import { useCameraPermissions } from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Pressable, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Camera from '../Camera';
import TextBold from '../TextBold';
import TextRegular from '../TextRegular';

interface IMediaPickerModalProps {
  onCapture: (file: ReactNativeFile) => void;
  setModalVisible: (isModalVisible: boolean) => void;
  isModalVisible: boolean;
  setFiles: (files: ReactNativeFile[]) => void;
  allowMultiple?: boolean;
}

export default function MediaPickerModal(props: IMediaPickerModalProps) {
  const {
    onCapture,
    setModalVisible,
    isModalVisible,
    setFiles,
    allowMultiple = true,
  } = props;

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const insets = useSafeAreaInsets();

  const closeModal = () => setModalVisible(false);

  const pickDocuments = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: MimeTypes.PDF,
      });
      const { canceled, assets } = result;
      if (canceled || !assets?.length) return;

      const uploadedFiles = await Promise.all(
        assets.map(
          async (asset) =>
            new ReactNativeFile({
              uri: asset.uri,
              name: asset.name || Date.now().toString(),
              type: asset.mimeType || MimeTypes.PDF,
            })
        )
      );

      setFiles(uploadedFiles);
      setModalVisible(false);
    } catch (error) {
      console.error('DocumentPicker Error: ', error);
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

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        allowsMultipleSelection: allowMultiple,
      });

      if (!result.canceled && result.assets) {
        const uploadedImages = await Promise.all(
          result.assets.map(async (asset) => {
            const resizedPhoto = await resizeImage({ uri: asset.uri });
            return new ReactNativeFile({
              uri: resizedPhoto.uri,
              name: asset?.fileName || Date.now().toString(),
              type: asset.mimeType || 'image/jpeg',
            });
          })
        );

        setFiles(uploadedImages);
        setModalVisible(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Panel & content styles
  const panelStyle: ViewStyle = isCameraOpen
    ? {
        // full-screen camera
        flex: 1,
        backgroundColor: Colors.WHITE,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        shadowOpacity: 0,
        elevation: 0,
        margin: 0,
      }
    : {
        // sheet spans screen width; we create insets via content padding
        backgroundColor: 'transparent',
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        shadowOpacity: 0,
        elevation: 0,
        // ❌ no margins here (prevents overflow on the right)
      };

  const contentStyle: ViewStyle = isCameraOpen
    ? {
        paddingHorizontal: 0,
        paddingBottom: 0,
        paddingTop: 0,
        flex: 1,
      }
    : {
        // ✅ use padding to inset the floating cards and keep them centered
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 20,
        paddingTop: 0,
        alignSelf: 'stretch',
      };

  return (
    <BaseModal
      title={null}
      isOpen={isModalVisible}
      onClose={closeModal}
      variant="sheet"
      direction="up"
      backdropOpacity={0.5}
      panelStyle={panelStyle}
      contentStyle={contentStyle}
    >
      {isCameraOpen ? (
        <Camera
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
              ...Shadow,
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

            <Pressable
              onPress={pickDocuments}
              style={{
                padding: Spacings.sm,
                alignItems: 'center',
                borderTopWidth: 0.5,
                borderTopColor: Colors.NEUTRAL_LIGHT,
              }}
              accessibilityRole="button"
              accessibilityHint="opens file library"
            >
              <TextRegular color={Colors.PRIMARY}>Upload PDF file</TextRegular>
            </Pressable>
          </View>

          <Pressable
            style={{
              backgroundColor: Colors.WHITE,
              borderRadius: 8,
              padding: Spacings.sm,
              alignItems: 'center',
              ...Shadow,
            }}
            accessibilityRole="button"
            accessibilityHint="close map selection"
            onPress={closeModal}
          >
            <TextBold color={Colors.PRIMARY}>Cancel</TextBold>
          </Pressable>
        </>
      )}
    </BaseModal>
  );
}
