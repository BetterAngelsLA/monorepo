import { SELECT_ALL_LABEL_DEFAULT, SELECT_ALL_VALUE } from './constants';
import { TGetVisibleOptions, getVisibleOptions } from './getVisibleOptions';

type TOption = {
  label: string;
  value: number;
  random?: string;
};

const baseOptions: TOption[] = [
  { label: 'Aaa 111', value: 1, random: 'hello' },
  { label: 'BBB 222', value: 2, random: 'hello again' },
  { label: 'Cxx 333', value: 2 },
  { label: 'Dxx 444', value: 2 },
] as const;

type TTestCase = {
  title: string;
  inputs: TGetVisibleOptions<TOption>;
  result: any;
};

const baseOptionsTestParams: TGetVisibleOptions<TOption> = {
  options: baseOptions,
  labelKey: 'label',
  valueKey: 'value',
};

const testCases: TTestCase[] = [
  {
    title: 'base happy path',
    inputs: baseOptionsTestParams,
    result: baseOptions,
  },
  {
    title: 'specific search text',
    inputs: {
      ...baseOptionsTestParams,
      searchText: 'BBB 222',
    },
    result: [baseOptions[1]],
  },
  {
    title: 'partial search text unique result',
    inputs: {
      ...baseOptionsTestParams,
      searchText: 'BBB',
    },
    result: [baseOptions[1]],
  },
  {
    title: 'partial search text multiple results',
    inputs: {
      ...baseOptionsTestParams,
      searchText: 'XX',
    },
    result: [baseOptions[2], baseOptions[3]],
  },
  {
    title: 'partial search text multiple results',
    inputs: {
      ...baseOptionsTestParams,
      searchText: 'XX',
    },
    result: [baseOptions[2], baseOptions[3]],
  },
  {
    title: 'with basic Select All',
    inputs: {
      ...baseOptionsTestParams,
      withSelectAll: true,
    },
    result: [
      ...baseOptions,
      {
        label: SELECT_ALL_LABEL_DEFAULT,
        value: SELECT_ALL_VALUE,
      },
    ],
  },
  {
    title: 'with Select All and search result',
    inputs: {
      ...baseOptionsTestParams,
      searchText: 'BBB 222',
      withSelectAll: true,
    },
    result: [baseOptions[1]],
  },
  {
    title: 'with Select All and multiple search results',
    inputs: {
      ...baseOptionsTestParams,
      searchText: 'xX',
      withSelectAll: true,
    },
    result: [baseOptions[3], baseOptions[2]],
  },
];

describe('getVisibleOptions for MultiSelect', () => {
  testCases.forEach((testCase: TTestCase) => {
    it(`should handle ${testCase.title}`, () => {
      const result = getVisibleOptions(testCase.inputs);

      expect(result).toEqual(expect.arrayContaining(testCase.result));
    });
  });
});
