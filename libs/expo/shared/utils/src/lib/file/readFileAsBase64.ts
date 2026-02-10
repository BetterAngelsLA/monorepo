import * as FileSystem from 'expo-file-system/legacy';

export async function readFileAsBase64(fileUri: string): Promise<string> {
  return FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}
