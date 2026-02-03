import sanitizeHtml, { IOptions as SanitizeHtmlOptions } from 'sanitize-html';

const defaultSanitizeOptions: SanitizeHtmlOptions = {
  allowedTags: [], // remove ALL HTML tags
  allowedAttributes: {}, // remove ALL attributes
  disallowedTagsMode: 'discard', // completely drop bad tags (like script)
};

export function sanitizeHtmlString(
  htmlInput?: string | null,
  overrideOptions?: SanitizeHtmlOptions
): string {
  if (!htmlInput) {
    return '';
  }

  const trimmedHtmlInput = htmlInput.trim();

  if (!trimmedHtmlInput) {
    return '';
  }

  const mergedOptions: SanitizeHtmlOptions = {
    ...defaultSanitizeOptions,
    ...overrideOptions,
  };

  const cleanedHtml = sanitizeHtml(trimmedHtmlInput, mergedOptions);

  return cleanedHtml.trim();
}
