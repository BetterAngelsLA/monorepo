const previewByFileId = new Map<
  string,
  { uri: string; mimeType: string }
>();

export function setHmisFilePreview(
  fileId: string,
  data: { uri: string; mimeType: string }
): void {
  if (!data.uri) return;
  previewByFileId.set(String(fileId), data);
}

export function getHmisFilePreview(fileId: string): {
  uri: string;
  mimeType: string;
} | null {
  const entry = previewByFileId.get(String(fileId));
  return entry ?? null;
}
