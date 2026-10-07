/**
 * Module-scope constants for the BottomSheet provider: defaults, Gorhom status
 * values, and the timings used by the present/dismiss machinery.
 *
 * See the provider header for what the rules behind them are.
 */

import { BottomSheetOptions } from '../../types';
import { TSheetFlags } from './types';

/** Provider defaults, when the provider is mounted without any. */
export const EMPTY_SHEET_OPTIONS: BottomSheetOptions = {};

/** The flags every new sheet starts with. */
export const NEW_SHEET_FLAGS: TSheetFlags = {
  presented: false,
  closing: false,
  dismissed: false,
  closeNotified: false,
};

/**
 * Gorhom `MODAL_STATUS` (the enum is not exported) — the values in which
 * `dismiss()` is safe and effective: 1 PRESENTED, 2 CLOSED, 3 MINIMIZED,
 * 6 DISMISSING, 7 DISMISSED. Any other status means wait: dismissing mid-flight
 * is what latches Gorhom forever (rule 2), and an unrecognised status is
 * exactly when we should not guess.
 */
export const GORHOM_DISMISSABLE_STATUSES: ReadonlyArray<number> = [
  1, 2, 3, 6, 7,
];

/** How long `dismissWhenReady` keeps re-checking before leaving the sheet open. */
export const DISMISS_DEFER_TIMEOUT_MS = 1000;

/** How often `watchDismissal` re-asks Gorhom, and how many times. */
export const DISMISS_RETRY_INTERVAL_MS = 400;
export const DISMISS_RETRY_ATTEMPTS = 3;
