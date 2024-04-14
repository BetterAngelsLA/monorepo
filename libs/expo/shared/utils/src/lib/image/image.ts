import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';

/**
 * Asynchronously gets the dimensions of an image.
 * @param uri The URI of the image to analyze.
 * @returns A promise that resolves to an object containing the width and height of the image.
 */
async function getImageDimensions(
  uri: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

/**
 * Resizes an image so that its smallest dimension matches a specified resolution,
 * while maintaining the original aspect ratio.
 * @param uri The URI of the image to be resized.
 * @param targetResolution The target resolution for the smaller dimension. Defaults to 1080.
 * @returns A promise that resolves to the result of the image manipulation.
 */
export async function resizeImage({
  uri,
  compress = 0.8,
  targetResolution = 1080,
}: {
  uri: string;
  compress?: number;
  targetResolution?: number;
}): Promise<ImageManipulator.ImageResult> {
  try {
    const { width, height } = await getImageDimensions(uri);
    const actions = [];

    if (width < height) {
      const newWidth = Math.min(targetResolution, width);
      actions.push({ resize: { width: newWidth } });
    } else {
      const newHeight = Math.min(targetResolution, height);
      actions.push({ resize: { height: newHeight } });
    }

    return await ImageManipulator.manipulateAsync(uri, actions, {
      compress: compress,
      format: ImageManipulator.SaveFormat.JPEG,
    });
  } catch (err) {
    console.error('Error resizing image: ', err);
    throw err;
  }
}
