import * as FileSystem from 'expo-file-system';

/**
 * Caches a base64 image string to the local file system.
 * Returns the file URI if successful, or null if it failed.
 *
 * @param id Unique identifier for the file (used for naming)
 * @param preview Object containing uri (base64) and mimeType
 */
export async function cacheHmisPreview(
  id: string | number,
  preview: { uri: string; mimeType: string }
): Promise<string | null> {
  if (!preview.uri || !preview.uri.includes(',')) {
    return null;
  }

  try {
    const base64Data = preview.uri.split(',')[1];
    const ext = preview.mimeType.split('/')[1] || 'bin';
    const filename = `preview-${id}.${ext}`;
    const fileUri = `${FileSystem.cacheDirectory}${filename}`;

    // Optimization: check if file already exists to avoid rewriting
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) {
      return fileUri;
    }

    await FileSystem.writeAsStringAsync(fileUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return fileUri;
  } catch (error) {
    console.warn('[cacheHmisPreview] Failed to cache image:', error);
    return null;
  }
}
