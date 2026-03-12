import { MimeTypes } from '@monorepo/expo/shared/static';
import { TMediaOptionLabels } from './MediaPickerMenu';

export const ALLOWED_UPLOAD_TYPES = [
  // Documents
  MimeTypes.PDF,
  MimeTypes.DOCX,
  MimeTypes.DOC,
  MimeTypes.XLSX,
  MimeTypes.XLS,
  MimeTypes.TXT,

  // Images
  MimeTypes.JPEG,
  MimeTypes.PNG,
  MimeTypes.WEBP,
  MimeTypes.GIF,
] as const;

export type TMediaPickerMimeType = (typeof ALLOWED_UPLOAD_TYPES)[number];

export const menuLabelDefaults: Required<TMediaOptionLabels> = {
  image: 'From Photo Album',
  camera: 'Take Photo',
  file: 'Upload a file',
};
