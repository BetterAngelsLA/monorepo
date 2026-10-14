import { normalizeUrlScheme } from './normalizeUrlScheme';

const cases: [string, string | null][] = [
  // prepends https:// to bare domains
  ['google.com', 'https://google.com'],
  ['www.example.org', 'https://www.example.org'],
  ['example.org/page', 'https://example.org/page'],
  ['  google.com  ', 'https://google.com'],
  ['example.c', 'https://example.c'],
  // returns original value when scheme already present
  ['https://google.com', 'https://google.com'],
  ['http://example.org', 'http://example.org'],
  ['ftp://files.com', 'ftp://files.com'],
  ['httpx://example.com', 'httpx://example.com'],
  // single-slash typos are treated as bare domains — downstream validation rejects
  ['http:/example.com', 'https://http:/example.com'],
  // returns null for empty / whitespace
  ['', null],
  ['   ', null],
];

describe('normalizeUrlScheme', () => {
  it.each(cases)('%p => %p', (input, expected) => {
    expect(normalizeUrlScheme(input)).toBe(expected);
  });
});
