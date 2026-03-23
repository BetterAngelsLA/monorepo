import sanitizeHtmlLib, {
  IOptions as SanitizeHtmlOptions,
} from 'sanitize-html';

const defaultSanitizeOptions: SanitizeHtmlOptions = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: 'discard',
};

export function sanitizeHtml(
  html?: string | null,
  options: SanitizeHtmlOptions = defaultSanitizeOptions
): string {
  if (typeof html !== 'string') {
    return '';
  }

  const trimmedHtml = html.trim();

  if (!trimmedHtml.length) {
    return '';
  }

  return sanitizeHtmlLib(trimmedHtml, options).trim();
}
