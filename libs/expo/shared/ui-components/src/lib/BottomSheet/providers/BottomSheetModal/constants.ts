/**
 * Module-scope constants for the BottomSheet provider: defaults, Gorhom status
 * values, and the timings used by the present/dismiss machinery.
 *
 * See the provider header for what the rules behind them are.
 */

import { BottomSheetOptions } from '../../types';
import type { TGorhomModalStatus, TSheetFlags } from './types';

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
 * Gorhom's `MODAL_STATUS`, mirrored because the enum is not exported (index =
 * value). Named so the numbers below read as statuses instead of magic
 * integers.
 */
export const GORHOM_MODAL_STATUS = {
  INITIAL: 0,
  PRESENTED: 1,
  CLOSED: 2,
  MINIMIZED: 3,
  MINIMIZING: 4,
  ANIMATING: 5,
  DISMISSING: 6,
  DISMISSED: 7,
} as const;

/**
 * The statuses in which `dismiss()` is safe and effective. Any other status
 * means wait: dismissing mid-flight is what latches Gorhom forever (rule 2),
 * and an unrecognised status is exactly when we should not guess.
 */
export const GORHOM_DISMISSABLE_STATUSES: ReadonlyArray<TGorhomModalStatus> = [
  GORHOM_MODAL_STATUS.PRESENTED,
  GORHOM_MODAL_STATUS.CLOSED,
  GORHOM_MODAL_STATUS.MINIMIZED,
  GORHOM_MODAL_STATUS.DISMISSING,
  GORHOM_MODAL_STATUS.DISMISSED,
];

/** How long `dismissWhenReady` keeps re-checking before leaving the sheet open. */
export const DISMISS_DEFER_TIMEOUT_MS = 1000;

/** How often `watchDismissal` re-asks Gorhom, and how many times. */
export const DISMISS_RETRY_INTERVAL_MS = 400;
export const DISMISS_RETRY_ATTEMPTS = 3;
