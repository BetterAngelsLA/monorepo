/**
 * useMutationWithErrors
 * ----------------------
 * A thin wrapper around Apollo’s `useMutation` that exposes both `data` and `errors`
 * in a predictable, type-safe way.
 *
 * ## Why
 * Apollo Client v4 deprecated `FetchResult` and `MutateResult`, and the built-in
 * `useMutation` type doesn’t include the `errors` array that Apollo may attach
 * when `errorPolicy: 'all'` is used. This wrapper provides:
 *   - Type-safe access to both `data` and `errors`
 *   - Full type inference from generated `TypedDocumentNode`
 *   - No need to cast results or use deprecated types
 *
 * ## What it does
 * - Calls Apollo’s `useMutation` under the hood.
 * - Returns an `execute` function with the exact same parameters as `mutate`.
 * - Always resolves to an `ExecutedMutationResult<TData>` containing:
 *     - `data` — your mutation result (if any)
 *     - `errors` — any GraphQL errors returned when using `errorPolicy: 'all'`
 *
 * ## Example
 * ```ts
 * const [updateClient, { loading }] = useMutationWithErrors(UpdateClientDocument);
 *
 * const { data, errors } = await updateClient({
 *   variables: { input },
 *   errorPolicy: 'all',
 * });
 *
 * if (errors) {
 *   console.error(errors); // GraphQL errors, not network errors
 * }
 * ```
 *
 * ## Summary
 * Problem -> Solution
 * 1. Apollo’s `useMutation` omits the `errors` array -> Exposes `errors` via `ExecutedMutationResult`
 * 2. Deprecated `FetchResult` / `MutateResult` -> Uses modern `TypedDocumentNode` generics
 * 3. Repeated unsafe casts (`as any`) -> Returns properly typed, unified result
 *
 * This helper keeps all mutations consistent and type-safe across the codebase.
 */

import type { OperationVariables } from '@apollo/client/core';
import { useMutation } from '@apollo/client/react';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { GraphQLError } from 'graphql';

type ExecutedMutationResult<TData> = {
  data?: TData | null;
  errors?: readonly GraphQLError[];
};

export function useMutationWithErrors<
  TData,
  TVariables extends OperationVariables = OperationVariables
>(
  document: TypedDocumentNode<TData, TVariables>,
  options?: Parameters<typeof useMutation<TData, TVariables>>[1]
) {
  const [mutate, state] = useMutation<TData, TVariables>(document, options);

  // preserve the exact param shape of `mutate`
  async function execute(
    ...args: Parameters<typeof mutate>
  ): Promise<ExecutedMutationResult<TData>> {
    const result = await mutate(...args);

    return {
      data: result.data ?? undefined,
      // Apollo may put this on the result at runtime (errorPolicy: 'all')
      errors: (result as { errors?: readonly GraphQLError[] }).errors,
    };
  }

  return [execute, state] as const;
}
