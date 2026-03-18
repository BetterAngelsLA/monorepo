import sanitizeHtml, { IOptions as SanitizeHtmlOptions } from 'sanitize-html';

const sanitizeWysiwygOptions: SanitizeHtmlOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags,
  allowedAttributes: sanitizeHtml.defaults.allowedAttributes,
  disallowedTagsMode: 'discard',
};

export function sanitizeWysiwygHtml(html?: string | null): string {
  if (typeof html !== 'string') {
    return '';
  }

  const trimmedHtml = html.trim();

  if (!trimmedHtml.length) {
    return '';
  }

  return sanitizeHtml(trimmedHtml, sanitizeWysiwygOptions).trim();
}
