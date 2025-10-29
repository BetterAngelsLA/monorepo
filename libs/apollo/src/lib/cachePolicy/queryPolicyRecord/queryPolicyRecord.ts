import type { FieldPolicy, TypePolicy } from '@apollo/client';
import { DEFAULT_QUERY_RESULTS_KEY } from '../constants';
import { generateFieldPolicy } from '../generateFieldPolicy';
import type {
  KeyArgSpec,
  OffsetListKey,
  ResultItemOf,
  TDefaultResultsKey,
  TypenameOf,
} from '../types';

type MergeOptionsArg = Parameters<typeof generateFieldPolicy>[0]['mergeOpts'];

type QueryPolicyRecordProps<
  TQuery,
  TVariables,
  TResultsKey extends string,
  TFieldKey extends OffsetListKey<TQuery, TResultsKey> & string
> = {
  key: TFieldKey;
  resultsKey?: TResultsKey;
  entityTypename: TypenameOf<ResultItemOf<TQuery, TFieldKey, TResultsKey>>;
  keyArgs: readonly KeyArgSpec<TVariables>[];
  mergeOpts?: MergeOptionsArg;
  keyFields?: TypePolicy['keyFields'];
};

export function queryPolicyRecord<
  TQuery,
  TVariables,
  TResultsKey extends string = TDefaultResultsKey,
  TFieldKey extends OffsetListKey<TQuery, TResultsKey> & string = OffsetListKey<
    TQuery,
    TResultsKey
  > &
    string
>(props: QueryPolicyRecordProps<TQuery, TVariables, TResultsKey, TFieldKey>) {
  const { key, resultsKey, entityTypename, keyArgs, mergeOpts, keyFields } =
    props;

  return {
    key,
    resultsKey: resultsKey ?? DEFAULT_QUERY_RESULTS_KEY,
    buildFn: () => {
      const fieldPolicy: FieldPolicy = generateFieldPolicy({
        keyArgs: keyArgs as any,
        mergeOpts,
      });

      // IMPORTANT: include keyFields so generateCachePolicies can hoist it
      return {
        entityTypename,
        fieldPolicy,
        keyFields,
      } as const;
    },
  } as const;
}
