import type { FieldPolicy } from '@apollo/client';
import { generateFieldPolicy } from '@monorepo/apollo';
import type {
  AllowedKeys,
  OffsetListKey,
  ResultItemOf,
  TypenameOf,
} from './types';

export function buildEntry<Q, V>(cfg: {
  key: OffsetListKey<Q> & string;
  entityTypename: TypenameOf<ResultItemOf<Q, typeof cfg.key & keyof Q>>;
  keyArgs: readonly AllowedKeys<V>[];
}) {
  const { key, entityTypename, keyArgs } = cfg;

  type K = typeof key & OffsetListKey<Q> & string;

  // optional compile-time assertion (no runtime impact)
  const _assert = (x: TypenameOf<ResultItemOf<Q, K>>) => x;
  _assert(entityTypename);

  return {
    key,
    build: () => {
      const fieldPolicy: FieldPolicy = generateFieldPolicy({
        keyArgs: [...keyArgs], // excludes 'pagination' via AllowedKeys<V>
      });

      return {
        entityTypename, // literal checked vs item __typename
        fieldPolicy,
      } as const;
    },
  } as const;
}
