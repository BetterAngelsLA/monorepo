import type { FieldFunctionOptions } from '@apollo/client';
import type { FieldMergeFunctionOptions } from '@apollo/client/cache';
import { Kind, type FieldNode } from 'graphql';

export type TItem = { id: number; name: string };

export type TMergedPayload = {
  results: (TItem | undefined)[];
  totalCount?: number;
  pageInfo?: Record<string, unknown>;
};

export const adaptPagination = (
  vars: { pagination?: { offset?: number; limit?: number } } | undefined,
) => vars?.pagination ?? {};

export const paginationKeys = {
  resultsKey: 'results',
  totalKey: 'totalCount',
  pageInfoKey: 'pageInfo',
};

// infer the type Apollo expects for readField
type TestReadField = FieldFunctionOptions<
  Record<string, unknown>,
  Record<string, unknown>
>['readField'];

const readFieldFn = ((fieldNameOrOpts: unknown, from?: unknown) => {
  const fieldName =
    typeof fieldNameOrOpts === 'string'
      ? fieldNameOrOpts
      : (fieldNameOrOpts as { fieldName?: string })?.fieldName;

  if (!fieldName) {
    return undefined;
  }

  return (from as Record<string, unknown>)?.[fieldName];
}) as TestReadField;

// Minimal FieldNode
export const testFieldNode: FieldNode = {
  kind: Kind.FIELD,
  name: { kind: Kind.NAME, value: 'testField' },
};

export function makeOptions(
  args: Record<string, unknown>,
): FieldMergeFunctionOptions<Record<string, unknown>, Record<string, unknown>> {
  return {
    args,
    readField: readFieldFn,
    fieldName: 'testField',
    field: testFieldNode,
    storeFieldName: 'testField',
    variables: undefined,
    toReference: ((v: unknown) =>
      v) as unknown as FieldFunctionOptions['toReference'],
    canRead: (() => true) as unknown as FieldFunctionOptions['canRead'],
    isReference: ((v: Record<string, unknown> | null) =>
      !!v &&
      typeof v['__ref'] ===
        'string') as unknown as FieldFunctionOptions['isReference'],
    mergeObjects: ((
      a: Record<string, unknown>,
      b: Record<string, unknown>,
    ) => ({ ...a, ...b })) as unknown as FieldFunctionOptions['mergeObjects'],
    cache: {} as unknown as FieldFunctionOptions['cache'],
    storage: {} as unknown as FieldFunctionOptions['storage'],
  } as unknown as FieldMergeFunctionOptions<
    Record<string, unknown>,
    Record<string, unknown>
  >;
}

export const generateIncoming = (
  items: TItem[],
  meta?: Partial<{ totalCount: number; pageInfo: Record<string, unknown> }>,
) => ({
  results: items,
  ...(meta?.totalCount !== undefined ? { totalCount: meta.totalCount } : {}),
  ...(meta?.pageInfo !== undefined ? { pageInfo: meta.pageInfo } : {}),
});
