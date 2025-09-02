import objectHash from 'object-hash';
import { hashObject, THashObjectProps } from './hashObject';

type TTestCase = {
  testName: string;
  options?: Omit<THashObjectProps, 'data'>;
  dataA: object;
  dataB: object;
  sameHash: boolean; // expectation: A and B produce same hash?
};

const testCases: TTestCase[] = [
  {
    testName: 'object key order ignored by default',
    dataA: {
      team: [{ id: '1', label: 'A' }],
      status: [],
      client: [],
      author: [],
    },
    dataB: {
      status: [],
      client: [],
      author: [],
      team: [{ id: '1', label: 'A' }],
    },
    sameHash: true,
  },
  {
    testName: 'array order ignored by default (unorderedArrays: true)',
    dataA: {
      team: [
        { id: '1', label: 'A' },
        { id: '2', label: 'B' },
      ],
      status: [],
    },
    dataB: {
      team: [
        { id: '2', label: 'B' },
        { id: '1', label: 'A' },
      ],
      status: [],
    },
    sameHash: true,
  },
  {
    testName: 'can exclude a prop',
    options: { keyList: ['label'], keyListStrategy: 'exclude' },
    dataA: { team: [{ id: '1', label: 'Alpha' }], status: [] },
    dataB: { team: [{ id: '1', label: 'Changed' }], status: [] },
    sameHash: true,
  },
  {
    testName: 'can use included prop only, ignores others',
    options: { keyList: ['id'], keyListStrategy: 'include' },
    dataA: { team: [{ id: '1', label: 'A', extra: 123 }], status: [] },
    dataB: { team: [{ id: '1', label: 'B', extra: 999 }], status: [] },
    sameHash: true,
  },
  {
    testName: 'different ids → different hashes (even if labels same)',
    options: { keyList: ['label'], keyListStrategy: 'exclude' },
    dataA: { team: [{ id: '1', label: 'Same' }], status: [] },
    dataB: { team: [{ id: '2', label: 'Same' }], status: [] },
    sameHash: false,
  },
  {
    testName: 'can use algorithm (sha1) deterministically',
    options: { algorithm: 'sha1' },
    dataA: { x: 1, y: [2, 3] },
    dataB: { y: [3, 2], x: 1 }, // same set, different order
    sameHash: true,
  },
  {
    testName: 'empty-ish structures hash the same',
    dataA: { team: [], status: [], client: [], author: [] },
    dataB: { author: [], status: [], client: [], team: [] },
    sameHash: true,
  },
  {
    testName: 'unorderedArrays option enforces order',
    options: { unorderedArrays: false },
    dataA: { team: [{ id: '1' }, { id: '2' }] },
    dataB: { team: [{ id: '2' }, { id: '1' }] },
    sameHash: false,
  },
  {
    testName: 'orderMatters=true impacts hash',
    options: { orderMatters: true },
    dataA: { team: [{ id: '1' }, { id: '2' }] },
    dataB: { team: [{ id: '2' }, { id: '1' }] },
    sameHash: false,
  },
  {
    testName: 'can override orderMatters with unorderedArrays',
    options: { orderMatters: true, unorderedArrays: true },
    dataA: { team: [{ id: '1' }, { id: '2' }] },
    dataB: { team: [{ id: '2' }, { id: '1' }] },
    sameHash: true,
  },
];

describe('hashObject', () => {
  testCases.forEach(({ testName, options, dataA, dataB, sameHash }) => {
    const extraOpts = options || {};
    test(testName, () => {
      const hA = hashObject({ ...extraOpts, data: dataA });
      const hB = hashObject({ ...extraOpts, data: dataB });

      if (sameHash) {
        expect(hA).toBe(hB);
      } else {
        expect(hA).not.toBe(hB);
      }

      expect(typeof hA).toBe('string');
      expect(typeof hB).toBe('string');
    });
  });

  test('object-hash returns Buffer when encoding="buffer"', () => {
    const buf = objectHash({ a: 1 }, { encoding: 'buffer' as any });

    expect(Buffer.isBuffer(buf)).toBe(true);
  });
});
