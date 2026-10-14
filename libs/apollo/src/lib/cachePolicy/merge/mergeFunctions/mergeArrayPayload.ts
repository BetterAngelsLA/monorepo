/**
 * mergeArrayPayload
 *
 * Apollo `FieldMergeFunction` for a paginated response whose field is the
 * **array itself** (no `results`/`totalCount` envelope). Each incoming page is
 * placed at its target offsets:
 *
 *     merged[offset + i] = incoming[i]
 *
 * Kept in step with `mergeObjectPayload`, which carries the full rationale:
 * offset pagination degrades when items move between pages while paginating,
 * and a write at offset 0 is the one case this merge reconciles — it restarts
 * the list, so rows the server no longer returns cannot survive at the tail.
 * Splicing a first page instead strands them, which is exactly the DEV-2466
 * bug: a client profile merged away in the Django admin keeps rendering.
 * Deeper pages are still not sifted around, because leaving `undefined` holes
 * behind makes Apollo unable to read the field. Use cursor/Relay pagination
 * (`relayStylePagination`) if a list needs fully move-proof pagination.
 *
 * Reachability: not wired up today. No entry in `cachePolicyRegistry` passes
 * `mergeOpts`, so `generateMergeFn` always takes the `MergeModeEnum.Object`
 * branch, and `getQueryPolicyFactory` warns that array mode "is not yet fully
 * supported". The behaviour below is therefore covered by tests rather than by
 * production traffic — align it with `mergeObjectPayload` now so that adopting
 * array mode cannot silently resurrect the stale-tail bug.
 */

import type { FieldMergeFunction } from '@apollo/client';
import type { FieldMergeFunctionOptions } from '@apollo/client/cache';
import type { ResolveMergePagination } from '../types';

export function mergeArrayPayload<TItem = unknown, TVars = unknown>(
  resolvePagination: ResolveMergePagination<TVars>,
): FieldMergeFunction<
  readonly TItem[] | undefined,
  readonly TItem[] | undefined,
  FieldMergeFunctionOptions<Record<string, unknown>, Record<string, unknown>>
> {
  return (existing, incoming, options) => {
    const { offset = 0 } =
      resolvePagination(options.args as TVars) ||
      ({} as Record<string, unknown>);

    const prev = (existing as readonly TItem[] | undefined) ?? [];
    const next = (incoming as readonly TItem[] | undefined) ?? [];

    // A write at offset 0 restarts the list, so treat it as authoritative and
    // discard what we held. Splicing it over the existing array instead leaves
    // rows the server no longer returns stranded at the tail. This mirrors
    // Apollo's `relayStylePagination`, which replaces rather than appends when
    // no `after`/`before` cursor is supplied, and matches `mergeObjectPayload`
    // (DEV-2466).
    //
    // Deeper offsets still splice: a page-2 fetch says nothing about page 1.
    const merged = offset === 0 ? [] : (prev.slice() as (TItem | undefined)[]);

    for (let i = 0; i < next.length; i++) merged[offset + i] = next[i] as TItem;

    return merged as unknown as readonly TItem[];
  };
}
