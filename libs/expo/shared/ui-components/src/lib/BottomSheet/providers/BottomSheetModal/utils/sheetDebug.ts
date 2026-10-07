/**
 * Dev-only tracing for the sheet lifecycle.
 *
 * Set `EXPO_PUBLIC_BOTTOM_SHEET_DEBUG_LEVEL=1` (e.g. in
 * `apps/betterangels/.env.local`) and reload; level `2` also turns on Gorhom's
 * own internal trace (`[BottomSheet::handleDismiss]`, `handleForceClose`,
 * `animateToPosition`, …), which is what tells you where a dismissal silently
 * stops. Never on in production builds.
 *
 * Lines are `[sheet] #<id> <what happened>`, with Gorhom's modal status in
 * brackets when it explains the difference:
 *
 *   [sheet] #3 dismiss deferred (gorhom ANIMATING)   not dismissable yet: wait
 *   [sheet] #3 dismiss                               handed to Gorhom
 *   [sheet] #3 dismiss retry 1/3 (gorhom DISMISSING) nothing confirmed yet
 *   [sheet] #3 dismiss never confirmed (…)           still on screen: a bug
 *   [sheet] #3 dismiss cancelled (gorhom ANIMATING)  gave up: stays open
 *
 * ...plus one snapshot per provider render, listing every live sheet:
 *
 *   [sheet] render #16 | #3 presented,closing,dismissed gorhom=DISMISSING
 *
 * Snapshot flags: `presented` (present requested), `closing` (close requested),
 * `dismissed` (handed to Gorhom), `closeNotified` (onClose delivered); `idle` =
 * none set. `render #N` is the provider's Nth commit since tracing started — it
 * orders these lines and makes a render storm obvious.
 */

import { BottomSheetModal, enableLogging } from '@gorhom/bottom-sheet';
import { useEffect, useRef } from 'react';
import { TSheet, TSheetFlags } from '../types';
import { getGorhomStatus } from './gorhomStatus';

/**
 * Inlined at bundle time, so changing it needs a reload (clear the Metro cache
 * if the new value doesn't seem to stick); never on in production builds.
 */
const LOG_LEVEL = process.env['EXPO_PUBLIC_BOTTOM_SHEET_DEBUG_LEVEL'];

const SHEET_DEBUG_ENABLED =
  process.env['NODE_ENV'] !== 'production' && ['1', '2'].includes(LOG_LEVEL);

if (SHEET_DEBUG_ENABLED && LOG_LEVEL === 2) {
  enableLogging([]);
}

/**
 * The one place that writes to the console: keeps the gate and the `[sheet]`
 * prefix in a single spot, so lifecycle events and render snapshots come out as
 * one chronological trace.
 */
function logSheetLine(text: string): void {
  if (SHEET_DEBUG_ENABLED) {
    console.log(`[sheet]${text}`);
  }
}

/**
 * Log what happened to one sheet, e.g.
 * `[sheet] #1 dismiss retry 1/3 (gorhom DISMISSING)`. Pass `gorhomStatus` when
 * the modal's own status is what explains the line; it is printed by name.
 */
export function logSheetDebug(
  event: string,
  id: string,
  gorhomStatus?: number,
): void {
  const status =
    gorhomStatus === undefined
      ? ''
      : ` (gorhom ${gorhomStatusName(gorhomStatus)})`;

  logSheetLine(` ${sheetRef(id)} ${event}${status}`);
}

/**
 * Per-render snapshot tracing, wired into the provider's render body:
 * `useSheetDebugSnapshot(sheets, instancesRef)`. Logs nothing unless
 * `SHEET_DEBUG_ENABLED`.
 */
export function useSheetDebugSnapshot(
  sheets: TSheet[],
  instances: { current: Map<string, BottomSheetModal> },
): void {
  /** Provider's committed renders — reported as `render #N`. */
  const rendersRef = useRef(0);

  // No dependency array on purpose: one snapshot per render.
  useEffect(() => {
    if (!SHEET_DEBUG_ENABLED) {
      return;
    }

    rendersRef.current += 1;

    logSheetSnapshot(rendersRef.current, sheets, (id) => {
      const instance = instances.current.get(id);

      return instance ? getGorhomStatus(instance) : undefined;
    });
  });
}

/**
 * `sheet-<timestamp>-3` → `#3`: how these logs (and `present deferred` in the
 * provider) refer to a sheet.
 */
export function sheetRef(id: string): string {
  return `#${id.slice(id.lastIndexOf('-') + 1)}`;
}

/**
 * One snapshot per provider render — see the format legend at the top of the
 * file.
 */
function logSheetSnapshot(
  renders: number,
  sheets: TSheet[],
  gorhomStatusOf: (id: string) => number | undefined,
): void {
  const sheetsPart = sheets.length
    ? sheets
        .map(
          (sheet) =>
            `${sheetRef(sheet.id)} ${describeSheet(sheet)}` +
            ` gorhom=${gorhomStatusName(gorhomStatusOf(sheet.id))}`,
        )
        .join(' | ')
    : 'no sheets';

  logSheetLine(` render #${renders} | ${sheetsPart}`);
}

/** Flags currently set on a sheet, in `TSheet` order — e.g. `closing,dismissed`. */
const SHEET_FLAG_NAMES = [
  'presented',
  'closing',
  'dismissed',
  'closeNotified',
] as const satisfies ReadonlyArray<keyof TSheetFlags>;

function describeSheet(sheet: TSheet): string {
  const flags = SHEET_FLAG_NAMES.filter((flag) => sheet[flag]);

  return flags.length ? flags.join(',') : 'idle';
}

/**
 * Gorhom's `MODAL_STATUS` in enum order (index = value) — mirror of the
 * unexported enum, only ever used to print names. The values we act on live in
 * `../constants`.
 */
const GORHOM_STATUS_NAMES: ReadonlyArray<string> = [
  'INITIAL', // 0
  'PRESENTED', // 1
  'CLOSED', // 2
  'MINIMIZED', // 3
  'MINIMIZING', // 4
  'ANIMATING', // 5
  'DISMISSING', // 6
  'DISMISSED', // 7
];

/**
 * Status name, e.g. `ANIMATING` — or `unknown` when the handle exposes no
 * status (test doubles, or a Gorhom upgrade that moved the ref).
 */
function gorhomStatusName(status: number | undefined): string {
  return status === undefined
    ? 'unknown'
    : (GORHOM_STATUS_NAMES[status] ?? `unexpected(${status})`);
}
