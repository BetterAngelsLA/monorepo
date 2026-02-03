import { MergeModeEnum } from '../../constants';
import type { ObjectMergeMode, TCacheMergeOpts } from '../../merge/types';

/**
 * Normalize user-provided merge options by injecting standard
 * paths for items, totalCount, and itemId when in OBJECT merge mode.
 * - array mode: returned as-is
 * - object mode: we merge in the discovered paths, but user values win
 */
export function getMergeOptions(
  mergeOpts: TCacheMergeOpts | undefined,
  paths: Pick<
    ObjectMergeMode,
    'itemIdPath' | 'itemsPath' | 'totalCountPath'
  > = {}
): TCacheMergeOpts {
  const opts = mergeOpts ?? { mode: MergeModeEnum.Object };

  // array mode: return opts
  if (opts.mode === MergeModeEnum.Array) {
    return opts;
  }

  // object mode: inject paths exteded with opts
  return {
    ...paths,
    ...opts,
  };
}
