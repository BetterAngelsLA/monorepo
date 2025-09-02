import objectHash, { type NormalOption } from 'object-hash';

export type THashObjectProps = {
  data: object;

  /**
   * If true, array/Set/Map element order will affect the hash.
   * If false/undefined, order is ignored for these collections (default).
   * Note: object key order remains ignored (unorderedObjects stays true).
   */
  orderMatters?: boolean;

  /** Optional key allow/deny list on top of object-hash behavior */
  keyList?: string[];
  keyListStrategy?: 'include' | 'exclude';
} & NormalOption;

const defaultOpts: NormalOption = {
  algorithm: 'md5',
  encoding: 'hex',
};

export function hashObject(props: THashObjectProps): string {
  const { data, orderMatters, keyList = [], keyListStrategy, ...rest } = props;

  const options: NormalOption & { unorderedSets?: boolean } = {
    ...defaultOpts,
    ...{ unorderedArrays: !orderMatters, unorderedSets: !orderMatters },
    ...rest,
  };

  if (keyList.length && keyListStrategy) {
    options.excludeKeys = (key: string) =>
      keyListStrategy === 'include'
        ? !keyList.includes(key)
        : keyList.includes(key);
  }

  return objectHash(data, options);
}
