export function hasWysiwygContent(html?: string | null): boolean {
  if (typeof html !== 'string') {
    return false;
  }

  if (!html.trim().length) {
    return false;
  }

  const stripped = html
    // 1) drop all tags
    .replace(/<[^>]*>/g, '')
    // 2) remove any &nbsp; or &#160;
    .replace(/&(?:nbsp|#160);/gi, '')
    // 3) strip every kind of whitespace (spaces, tabs, newlines)
    .replace(/\s+/g, '');

  return stripped.length > 0;
}
