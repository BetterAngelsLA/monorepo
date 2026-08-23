import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { resizeImage } from '@monorepo/expo/shared/utils';
import { CameraView as ExpoCamera, ImageType } from 'expo-camera';
import { File, Paths } from 'expo-file-system';
import { RefObject, useCallback } from 'react';
import { isSimulator } from './isSimulator';

/**
 * A valid 1x1 JPEG used as the placeholder photo in the iOS Simulator, where
 * no camera exists to capture real pixels. Solid green (not white or black) so
 * a captured placeholder is visibly a placeholder rather than a broken frame.
 */
const SIMULATOR_PHOTO_BASE64 =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAv/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AIAIv//Z';

function createSimulatorPhoto(): ReactNativeFile {
  const timestamp = Date.now().toString();
  const photo = new File(Paths.cache, `${timestamp}.jpg`);

  photo.write(SIMULATOR_PHOTO_BASE64, { encoding: 'base64' });

  return new ReactNativeFile({
    uri: photo.uri,
    name: `${timestamp}.jpg`,
    type: 'image/jpeg',
  });
}

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
      cameraRef: RefObject<ExpoCamera | null>,
    ): Promise<CapturePictureResult> => {
      // The iOS Simulator has no camera: expo-camera's own simulator capture
      // path only works when the camera view is mounted — and mounting it
      // wedges an AVCaptureSession that can never start (~9s per mount, piling
      // up across open/close cycles). Since we render a placeholder instead of
      // mounting the camera there, produce the placeholder photo ourselves.
      if (isSimulator) {
        try {
          return {
            type: 'success',
            file: createSimulatorPhoto(),
          };
        } catch (error) {
          console.error('useCapturePicture Error:', error);

          return {
            type: 'error',
            error,
          };
        }
      }

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
    [imageType],
  );

  return { capture };
}
