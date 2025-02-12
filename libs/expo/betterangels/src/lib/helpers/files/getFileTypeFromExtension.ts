export type TFileType = 'image' | 'pdf' | 'other' | 'unknown' | null;

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff'];

// TODO: use mimeType if/when DEV-1493 is implemented
export function getFileTypeFromExtension(url?: string): TFileType {
  if (!url) {
    return null;
  }

  const extension = url.split('.').pop()?.toLowerCase();

  if (!extension) {
    return 'unknown';
  }

  if (IMAGE_EXTENSIONS.includes(extension)) {
    return 'image';
  }

  if (extension === 'pdf') {
    return 'pdf';
  }

  return 'other';
}
