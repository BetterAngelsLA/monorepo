/**
 * Human-readable label for a document's type, used in this menu's UI copy
 * (e.g. "Delete image?" / "Download file").
 */
export function getFileTypeLabel(mimeType?: string): string {
  return mimeType?.startsWith('image') ? 'image' : 'file';
}
