// toUrlKeyFieldValue.test.ts
import { toUrlKeyFieldValue } from './toUrlKeyFieldValue';

type TCase = {
  name: string;
  input: unknown;
  expected: string | undefined;
};

const cases: ReadonlyArray<TCase> = [
  { name: 'undefined -> undefined', input: undefined, expected: undefined },
  { name: 'null -> undefined', input: null, expected: undefined },
  { name: 'empty string -> undefined', input: '', expected: undefined },
  { name: 'whitespace -> undefined', input: '   ', expected: undefined },
  { name: 'number -> undefined', input: 123, expected: undefined },
  { name: 'object -> undefined', input: {}, expected: undefined },
  {
    name: 'array -> undefined',
    input: ['https://x.test/a.png?x=1'],
    expected: undefined,
  },

  {
    name: 'absolute URL: strip query params',
    input: 'https://cdn.test/media/a.jpg?Expires=1&Signature=abc',
    expected: 'https://cdn.test/media/a.jpg',
  },
  {
    name: 'absolute URL: strip hash',
    input: 'https://cdn.test/media/a.jpg#section',
    expected: 'https://cdn.test/media/a.jpg',
  },
  {
    name: 'absolute URL: keep origin+pathname (no query)',
    input: 'https://cdn.test/media/a.jpg',
    expected: 'https://cdn.test/media/a.jpg',
  },
  {
    name: 'absolute URL: strip query + hash',
    input: 'https://cdn.test/media/a.jpg?x=1#y',
    expected: 'https://cdn.test/media/a.jpg',
  },
  {
    name: 'fallback when URL() throws: relative path with query',
    input: '/media/a.jpg?x=1',
    expected: '/media/a.jpg',
  },
  {
    name: 'fallback when URL() throws: query fragment only',
    input: ' ?just-query-string',
    expected: undefined,
  },
  {
    name: 'fallback when URL() throws: filename with query',
    input: 'a.jpg?x=1',
    expected: 'a.jpg',
  },
  {
    name: "fallback when URL() throws: no '?'",
    input: 'not-a-url',
    expected: 'not-a-url',
  },
];

describe('toUrlKeyFieldValue (table-driven)', () => {
  test.each(cases)('$name', ({ input, expected }) => {
    expect(toUrlKeyFieldValue(input as any)).toBe(expected);
  });
});
