import type { FieldFunctionOptions } from '@apollo/client';
import { Kind, type FieldNode } from 'graphql';

export type TItem = { id: number; name: string };

export const adaptPagination = (
  vars: { pagination?: { offset?: number; limit?: number } } | undefined
) => vars?.pagination ?? {};

export const paginationKeys = {
  resultsKey: 'results',
  totalKey: 'totalCount',
  pageInfoKey: 'pageInfo',
};

const readFieldFn: any = (fieldName: string, item: any) => item?.[fieldName];

// Minimal FieldNode to satisfy FieldFunctionOptions.field
export const testFieldNode: FieldNode = {
  kind: Kind.FIELD,
  name: { kind: Kind.NAME, value: 'testField' },
};

// Build a full FieldFunctionOptions object with safe dummies for unused members
export function makeOptions(
  args: any
): FieldFunctionOptions<Record<string, unknown>, Record<string, unknown>> {
  return {
    args, // used by your adapt()
    readField: readFieldFn, // used by default getId
    fieldName: 'testField',
    field: testFieldNode,
    storeFieldName: 'testField',
    variables: undefined,
    toReference: ((v: any) => v) as any,
    canRead: (() => true) as any,
    isReference: ((v: any) => !!v && typeof v.__ref === 'string') as any,
    mergeObjects: ((a: any, b: any) => ({ ...a, ...b })) as any,
    cache: {} as any,
    storage: {} as any,
  };
}

export const generateIncoming = (
  items: TItem[],
  meta?: Partial<{ totalCount: number; pageInfo: any }>
) => ({
  results: items,
  ...(meta?.totalCount !== undefined ? { totalCount: meta.totalCount } : {}),
  ...(meta?.pageInfo !== undefined ? { pageInfo: meta.pageInfo } : {}),
});
