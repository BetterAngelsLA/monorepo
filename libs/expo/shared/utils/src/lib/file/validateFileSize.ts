import * as FileSystem from 'expo-file-system/legacy';

export async function validateFileSize(
  fileUri: string,
  maxBytes: number
): Promise<void> {
  const fileInfo = await FileSystem.getInfoAsync(fileUri);

  if (!fileInfo.exists) {
    throw new Error('File does not exist');
  }

  if (typeof fileInfo.size !== 'number') {
    throw new Error('Unable to determine file size');
  }

  if (fileInfo.size > maxBytes) {
    throw new Error(
      `File size ${fileInfo.size} exceeds limit of ${maxBytes} bytes`
    );
  }
}
