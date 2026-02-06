/**
 * Resolves the MIME type filter used by MediaPickerModal.
 *
 * @param mimeTypes - Optional list of allowed MIME types.
 *   - `undefined` → use the component default
 *   - `[]`        → allow all MIME types (no restriction)
 *   - `[...]`     → restrict to the provided MIME types
 *
 * @returns `expo-document-picker` type option:
 *   - `undefined`: no restrictions
 *   - mutable `string[]`
 */

import { MimeTypes, TMimeType } from '@monorepo/expo/shared/static';

const DEFAULT_FILE_MIME_TYPES: readonly TMimeType[] = [MimeTypes.PDF];

export function resolveMediaPickerMimeTypes(
  mimeTypes?: readonly TMimeType[]
): string[] | undefined {
  if (mimeTypes === undefined) {
    return [...DEFAULT_FILE_MIME_TYPES];
  }

  if (!mimeTypes.length) {
    return undefined;
  }

  return [...mimeTypes];
}
