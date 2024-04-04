// import * as ImageManipulator from 'expo-image-manipulator';
// import { resizeImage } from './image';

// // Mock 'expo-image-manipulator' module
// jest.mock('expo-image-manipulator', () => ({
//   manipulateAsync: jest.fn(),
// }));

// // Before each test, define what each mock should do
// beforeEach(() => {
//   // Reset and setup mock implementation for manipulateAsync for each test
//   jest.resetAllMocks();
//   const mockManipulateAsync = jest.mocked(ImageManipulator.manipulateAsync);
//   mockManipulateAsync.mockResolvedValue({
//     uri: 'path/to/resized/image.jpg',
//     width: 1080,
//     height: 608,
//   });
// });

// describe('resizeImage function', () => {
//   it('resizes an image correctly when width is the smaller dimension', async () => {
//     const targetResolution = 1080;
//     // Mock implementation for Image.getSize
//     Image.getSize = jest.fn((uri, successCallback) =>
//       successCallback(1920, 1080)
//     );
//     const result = await resizeImage(
//       'path/to/original/image.jpg',
//       targetResolution
//     );

//     // Expect the manipulateAsync to have been called with the correct parameters
//     expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
//       'path/to/original/image.jpg',
//       [{ resize: { width: targetResolution } }],
//       { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
//     );

//     // Validate the manipulated image dimensions
//     expect(result.width).toBeLessThanOrEqual(targetResolution);
//   });

//   // Add more tests as needed, such as for when height is the smaller dimension,
//   // or to test error handling scenarios.
// });
