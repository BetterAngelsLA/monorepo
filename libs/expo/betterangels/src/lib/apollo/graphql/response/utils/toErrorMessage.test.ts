import { describe, expect, it } from '@jest/globals';
import { toErrorMessage } from './toErrorMessage';

type ToErrorMessageTestCase = {
  input: unknown;
  expected: string | undefined;
};

const testCases: ToErrorMessageTestCase[] = [
  {
    input: null,
    expected: undefined,
  },
  {
    input: undefined,
    expected: undefined,
  },
  {
    input: 12345,
    expected: undefined,
  },
  {
    input: [12345],
    expected: undefined,
  },
  {
    input: true,
    expected: undefined,
  },
  {
    input: [true],
    expected: undefined,
  },
  {
    input: [2, false],
    expected: undefined,
  },
  {
    input: 'simple error',
    expected: 'simple error',
  },
  {
    input: '  spaced message  ',
    expected: 'spaced message',
  },
  {
    input: ['first', 'second', 'third'],
    expected: 'first, second, third',
  },
  {
    input: ['first', '  second  '],
    expected: 'first, second',
  },
  {
    input: ['hello', { key: 'value' }],
    expected: 'hello',
  },
  {
    input: '["one","two","three"]',
    expected: 'one, two, three',
  },
  {
    input: '"inner message"',
    expected: 'inner message',
  },
  {
    input: "['Name is invalid.']",
    expected: 'Name is invalid.',
  },
  {
    input: "['Name is invalid', 'Another invalid']",
    expected: 'Name is invalid, Another invalid',
  },
  {
    input: "['malformed strigified array']''",
    expected: undefined,
  },
];

describe('toErrorMessage', () => {
  for (const testCase of testCases) {
    it(`${testCase.input} -> <${testCase.expected}>`, () => {
      const actualResult = toErrorMessage(testCase.input);

      expect(actualResult).toBe(testCase.expected);
    });
  }
});
