import { hasWysiwygContent } from './hasWysiwygContent';

type TTestCase = [unknown, boolean];

const testCases: TTestCase[] = [
  [null, false],
  [false, false],
  [undefined, false],
  ['', false],
  ['  ', false],
  ['<p>  </p>', false],
  ['<p>&nbsp;</p>', false],
  ['<p>&nbsp; &nbsp;</p>', false],
  ['<p>&nbsp; &nbsp;&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p>', false],

  ['hello', true],
  ['<p>hello</p>', true],
  ['<p>&nbsp; hello &nbsp;</p>', true],
];

describe('hasWysiwygContent', () => {
  testCases.forEach((testCase: TTestCase) => {
    const caseDescriptor = testCase[0];

    it(`${caseDescriptor || 'falsy'} returns ${testCase[1]}`, () => {
      const result = hasWysiwygContent(
        testCase[0] as string | null | undefined
      );

      expect(result).toEqual(testCase[1]);
    });
  });
});
