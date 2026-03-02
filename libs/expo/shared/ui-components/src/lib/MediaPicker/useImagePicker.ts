import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { resizeImage } from '@monorepo/expo/shared/utils';
import * as ImagePicker from 'expo-image-picker';
import { useCallback } from 'react';

type ImagePickerResult =
  | { type: 'success'; files: ReactNativeFile[] }
  | { type: 'cancel' }
  | { type: 'error'; error: unknown };

type UseImagePickerParams = {
  allowMultiple?: boolean;
};

export function useImagePicker(params: UseImagePickerParams) {
  const { allowMultiple = true } = params;

  const pickImage = useCallback(async (): Promise<ImagePickerResult> => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        allowsMultipleSelection: allowMultiple,
      });

      if (result.canceled || !result.assets?.length) {
        return { type: 'cancel' };
      }

      // TODO <future>: separate selection from processing
      const uploadedImages = await Promise.all(
        result.assets.map(async (asset) => {
          const resizedPhoto = await resizeImage({ uri: asset.uri });

          return new ReactNativeFile({
            uri: resizedPhoto.uri,
            name: asset.fileName || Date.now().toString(),
            type: asset.mimeType || 'image/jpeg',
          });
        })
      );

      return {
        type: 'success',
        files: uploadedImages,
      };
    } catch (error) {
      console.error('useImagePicker Error:', error);

      return {
        type: 'error',
        error,
      };
    }
  }, [allowMultiple]);

  return { pickImage };
}
