import { sanitizeHtml } from './sanitizeHtml';

describe('sanitizeHtml', () => {
  it('returns an empty string for non-string content', () => {
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml(undefined)).toBe('');
  });

  it('strips all tags when defaultSanitizeOptions has allowedTags: []', () => {
    const html =
      '<p style="color: red; background-color: yellow;">Hello <span style="font-weight: 700;">world</span></p>';

    // allowedTags defaults to [] — all tags are stripped
    expect(sanitizeHtml(html)).toBe('Hello world');
  });

  it('strips script tags and their content, strips regular tags but keeps inner text', () => {
    const html =
      '<script style="color: red;">alert("xss")</script><p style="color: blue;">Safe</p>';

    // allowedTags defaults to [] — script content is stripped with its tag,
    // <p> is stripped, text content remains
    expect(sanitizeHtml(html)).toBe('Safe');
  });

  it('preserves allowed tags when custom options are passed', () => {
    const html = '<p>paragraph</p><span>inline</span><strong>bold</strong>';

    expect(sanitizeHtml(html, { allowedTags: ['p', 'strong'] })).toBe(
      '<p>paragraph</p>inline<strong>bold</strong>'
    );
  });
});
