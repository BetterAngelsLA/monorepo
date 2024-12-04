import { formatPhoneNumber } from './formatPhoneNumber';

type TTestCase = [any, any, any?];

const testCasesValid: TTestCase[] = [
  // valid
  ['2223334444', '(222) 333-4444'],
  ['  2223334444  ', '(222) 333-4444'],
  ['222-333-4444', '(222) 333-4444'],
  ['222 333 4444', '(222) 333-4444'],
  ['222333  4444', '(222) 333-4444'],
  // invalid or Int'l
  ['+1 2223334444', '12223334444'],
  ['+22 333-444-555-66', '2233344455566'],
  ['123', '123'],
  ['123-456', '123456'],
  ['123 456', '123456'],
  ['123-hello', '123'],
  ['abc', ''],
  [null, ''],
  [false, ''],
  [undefined, ''],
  [123, ''],
  [NaN, ''],
  [{}, '', 'emtpy object'],
  [[], '', 'empty array'],
];

describe('formatPhoneNumber', () => {
  testCasesValid.forEach((testCase: TTestCase) => {
    const caseDescriptor = testCase[2] || testCase[0];

    it(`should handle ${caseDescriptor}`, () => {
      const result = formatPhoneNumber(testCase[0]);

      expect(result).toEqual(testCase[1]);
    });
  });
});
