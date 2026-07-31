import { TMimeType } from '@monorepo/react/shared';

function mimeTypeToLabel(mime: TMimeType): string {
  const [type, subtype] = mime.split('/');

  if (subtype === '*') {
    return type.charAt(0).toUpperCase() + type.slice(1) + 's';
  }

  return subtype.toUpperCase();
}

export function getSupportedFilesText(
  acceptedMimeTypes: TMimeType[] | undefined
): string | undefined {
  if (!acceptedMimeTypes) {
    return undefined;
  }

  return `Supported files: ${acceptedMimeTypes
    .map(mimeTypeToLabel)
    .join(', ')}`;
}
