import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';
import { resizeImage } from './image';

// Setup mock return values for Image.getSize
const mockGetImageSize = Image.getSize as jest.Mock;
mockGetImageSize.mockImplementation((uri, success) => success(1920, 1080));

// Setup mock return value for ImageManipulator.manipulateAsync
const mockManipulateAsync = ImageManipulator.manipulateAsync as jest.Mock;
mockManipulateAsync.mockResolvedValue({
  uri: 'path/to/resized/image.jpg',
  width: 1080,
  height: 608,
});

describe('resizeImage function', () => {
  it('resizes an image correctly when width is the smaller dimension', async () => {
    const targetResolution = 1080;
    const result = await resizeImage(
      'path/to/original/image.jpg',
      targetResolution
    );

    // Expect the manipulateAsync to have been called with the correct parameters
    expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
      'path/to/original/image.jpg',
      [{ resize: { width: targetResolution } }],
      { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
    );

    // Validate the manipulated image dimensions
    expect(result.width).toBeLessThanOrEqual(targetResolution);
  });

  // Add more tests as needed, such as for when height is the smaller dimension,
  // or to test error handling scenarios.
});
