import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { resizeImage } from '@monorepo/expo/shared/utils';
import { CameraView as ExpoCamera, ImageType } from 'expo-camera';
import { RefObject, useCallback } from 'react';

export type CapturePictureResult =
  | { type: 'success'; file: ReactNativeFile }
  | { type: 'cancel' }
  | { type: 'error'; error: unknown };

type UseCapturePictureParams = {
  imageType?: ImageType;
};

export function useCapturePicture(params: UseCapturePictureParams) {
  const { imageType = 'jpg' } = params;

  const capture = useCallback(
    async (
      cameraRef: RefObject<ExpoCamera | null>
    ): Promise<CapturePictureResult> => {
      if (!cameraRef.current) {
        return { type: 'error', error: new Error('Camera not ready') };
      }

      try {
        const photo = await cameraRef.current.takePictureAsync();

        if (!photo) {
          return { type: 'cancel' };
        }

        const resizedPhoto = await resizeImage({
          uri: photo.uri,
        });

        const mimeType =
          imageType === 'jpg' ? 'image/jpeg' : `image/${imageType}`;

        const file = new ReactNativeFile({
          uri: resizedPhoto.uri,
          name: `${Date.now().toString()}.${imageType}`,
          type: mimeType,
        });

        return {
          type: 'success',
          file,
        };
      } catch (error) {
        console.error('useCapturePicture Error:', error);

        return {
          type: 'error',
          error,
        };
      }
    },
    [imageType]
  );

  return { capture };
}
