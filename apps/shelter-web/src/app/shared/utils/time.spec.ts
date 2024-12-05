import { minutesToMiliSeconds } from './time';

type TTestCase = [any, any];

describe('minutesToMiliSeconds', () => {
  const testCasesValid: TTestCase[] = [
    [1, 1 * 60 * 1000],
    [10.5, 10.5 * 60 * 1000],
  ];

  testCasesValid.forEach((testCase: TTestCase) => {
    const caseDescriptor = `${testCase[0]} seconds`;

    it(`should handle ${caseDescriptor}`, () => {
      const result = minutesToMiliSeconds(testCase[0]);

      expect(result).toEqual(testCase[1]);
    });
  });
});
