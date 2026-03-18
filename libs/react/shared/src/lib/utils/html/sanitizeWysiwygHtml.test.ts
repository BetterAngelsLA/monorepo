import { sanitizeWysiwygHtml } from './sanitizeWysiwygHtml';

describe('sanitizeWysiwygHtml', () => {
  it('returns an empty string for non-string content', () => {
    expect(sanitizeWysiwygHtml(null)).toBe('');
    expect(sanitizeWysiwygHtml(undefined)).toBe('');
  });

  it('removes inline styles while preserving allowed markup', () => {
    const html =
      '<p style="color: red; background-color: yellow;">Hello <span style="font-weight: 700;">world</span></p>';

    expect(sanitizeWysiwygHtml(html)).toBe('<p>Hello <span>world</span></p>');
  });

  it('removes disallowed tags and their inline styles', () => {
    const html =
      '<script style="color: red;">alert("xss")</script><p style="color: blue;">Safe</p>';

    expect(sanitizeWysiwygHtml(html)).toBe('<p>Safe</p>');
  });
});
