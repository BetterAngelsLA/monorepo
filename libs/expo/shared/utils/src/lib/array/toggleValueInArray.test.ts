import { toggleValueInArray } from './toggleValueInArray';

type TTestCase = [any, any, any];

const testCasesValid: TTestCase[] = [
  [['a'], 'b', ['a', 'b']],
  [['a', 'b'], 'a', ['b']],
  [['a', 'a'], 'a', []],
  [[1, 2, 3], 1, [2, 3]],
  [[2, 3], 1, [2, 3, 1]],
  [[1], null, [1, null]],
  [[1, null], null, [1]],
];

describe('toggleValueInArray', () => {
  testCasesValid.forEach((testCase: TTestCase) => {
    it(`should return ${testCase[2]}`, () => {
      const result = toggleValueInArray(testCase[0], testCase[1]);

      expect(result).toEqual(testCase[2]);
    });
  });
});
