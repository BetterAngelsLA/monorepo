/**
 * The sheet list and its stacking rules.
 *
 * Pure derivation: no refs, no React, no Gorhom. `useSheetStack` owns the list
 * and applies the result of `resolveSheetsToClose`, which keeps the three stack
 * behaviors readable (and testable) without the lifecycle machinery around
 * them.
 */

import { TSheet } from '../../types';

/**
 * Sheets that must close because a newer one was opened on top of them, based
 * on the top sheet's `stackBehavior`:
 *
 * - 'push'    → nobody
 * - 'switch'  → the sheet directly below the top
 * - 'replace' → every other live sheet (default)
 *
 * `sheets` is in render order (last = top-most). Sheets that are already
 * closing are ignored: they are on their way out, so they must not be dismissed
 * twice or mistaken for the top.
 */
export function resolveSheetsToClose(sheets: TSheet[]): TSheet[] {
  const live = sheets.filter((sheet) => !sheet.closing);
  const top = live[live.length - 1];

  if (!top || top.stackBehavior === 'push') {
    return [];
  }

  return top.stackBehavior === 'switch'
    ? live.slice(-2, -1)
    : live.slice(0, -1);
}
