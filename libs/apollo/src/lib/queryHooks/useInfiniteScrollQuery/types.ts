import type {
  OperationVariables,
  QueryHookOptions,
  QueryResult,
} from '@apollo/client';

export type AnyGeneratedHook = (
  options: QueryHookOptions<any, any>
) => QueryResult<any, any>;

export type HookData<H> = H extends (
  options?: QueryHookOptions<infer D, any>
) => QueryResult<infer D2, any>
  ? D & D2
  : never;

export type HookVars<H> = H extends (
  options?: QueryHookOptions<any, infer V>
) => QueryResult<any, infer V2>
  ? V & V2
  : OperationVariables;
