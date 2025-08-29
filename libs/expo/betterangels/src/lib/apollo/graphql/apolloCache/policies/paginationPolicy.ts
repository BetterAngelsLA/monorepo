import type { FieldFunctionOptions, FieldPolicy } from '@apollo/client';

export type OffsetVars = { offset?: number | null; limit?: number | null };

/**
 * Generic offset pagination for wrapper objects that contain a results array.
 * No `any`; only `unknown` where Apollo types are intentionally broad.
 *
 * TItem:   item type inside results (only used internally for help; erased in the policy type)
 * TVars:   your query variables type (we'll narrow `options.args` to this)
 * KResults/KTotal/KPageInfo: string literal keys of the wrapper
 */

type TPolicyOpts<TItem, TVars> = {
  keyArgs: ReadonlyArray<string> | false;
  resultsKey?: string;
  totalKey?: string;
  pageInfoKey?: string;
  /** Map your variables to `{ offset, limit }`. Default: `vars.pagination.{offset,limit}` */
  adaptArgs?: (vars: TVars | undefined) => OffsetVars;
};

export function paginationPolicy<TItem, TVars>(
  opts: TPolicyOpts<TItem, TVars>
): FieldPolicy<Record<string, unknown>, Record<string, unknown>> {
  const {
    keyArgs,
    resultsKey = 'results',
    totalKey = 'totalCount',
    pageInfoKey = 'pageInfo',
    adaptArgs = (vars?: TVars) =>
      (vars as unknown as { pagination?: OffsetVars } | undefined)
        ?.pagination ?? {},
  } = opts;

  const policy: FieldPolicy<
    Record<string, unknown>,
    Record<string, unknown>
  > = {
    keyArgs,
    merge(
      existing: Readonly<Record<string, unknown>> | undefined,
      incoming: Record<string, unknown>,
      options: FieldFunctionOptions<
        Record<string, unknown>,
        Record<string, unknown>
      >
    ): Readonly<Record<string, unknown>> {
      const vars = options.args as unknown as TVars | undefined;
      const { offset } = adaptArgs(vars);

      const offesetVal = offset || 0;

      const prev =
        (existing?.[resultsKey] as ReadonlyArray<TItem> | undefined) ?? [];

      const next =
        (incoming?.[resultsKey] as ReadonlyArray<TItem> | undefined) ?? [];

      const merged: TItem[] = prev.slice() as TItem[];

      for (let i = 0; i < next.length; i++) {
        merged[offesetVal + i] = next[i] as TItem;
      }

      const out: Record<string, unknown> = { ...incoming };

      (out as Record<string, unknown>)[resultsKey] = merged as unknown;

      out[totalKey] = incoming[totalKey] ?? existing?.[totalKey];
      out[pageInfoKey] = incoming[pageInfoKey] ?? existing?.[pageInfoKey];

      // console.log();
      // console.log('| -------------  out  ------------- |');
      // console.log(out);
      // console.log();

      // Apollo expects a SafeReadonly<TExisting>; returning Readonly<Record<...>> satisfies it
      return out as Readonly<Record<string, unknown>>;
    },
  };

  return policy;
}
