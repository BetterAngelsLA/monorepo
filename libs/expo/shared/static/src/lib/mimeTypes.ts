export const MimeTypes = {
  PDF: 'application/pdf',
} as const;

export type TMimeType = (typeof MimeTypes)[keyof typeof MimeTypes];
