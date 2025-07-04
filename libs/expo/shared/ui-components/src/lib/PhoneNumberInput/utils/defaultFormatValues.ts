export function defaultFormatValues(phoneNumber: string, extension?: string) {
  const extensionStr = extension || '';
  const trimmedExt = extensionStr.trim();

  if (!trimmedExt) {
    return phoneNumber;
  }

  return `${phoneNumber}x${trimmedExt}`;
}
