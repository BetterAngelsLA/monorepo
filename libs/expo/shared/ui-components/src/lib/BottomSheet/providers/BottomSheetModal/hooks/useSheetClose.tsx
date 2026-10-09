/**
 * useSheetClose
 *
 * Everything that happens between "this sheet should close" and the record
 * being gone. Split out of `useSheetStack` so the close pipeline does not sit
 * at the same level as the stack machinery that drives it.
 *
 * --------------------------------------------------------------------------
 * THE CLOSE PIPELINE
 * --------------------------------------------------------------------------
 *
 *   1. requestCloseSheet   ask a sheet to close
 *   2. closeWhenReady      wait until Gorhom will accept the dismissal
 *   3. closeNow            hand it over — `instance.dismiss()`
 *   4. closeWithRetry      re-ask, bounded by DISMISS_RETRY_ATTEMPTS
 *   5. dropSheet           forget the record
 *
 * `dismiss` appears in one place only: stage 3, the handover. Everything else
 * either asks for a close or asks whether Gorhom is ready (`canDismiss` /
 * `getGorhomStatus`).
 *
 * Every stage is repeat-safe: the sheet may be gone, already closing, or never
 * materialised, so each one looks the record up first and bails when the answer
 * is "no". That is also what lets the stages call each other freely.
 *
 * The Gorhom behaviour this leans on — why a dismissal can wedge, why re-asking
 * too early makes it worse — is documented on `useSheetStack`, along with the
 * sheet flags these stages read and write. Read that first.
 */

import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useRef } from 'react';
import {
  DISMISS_DEFER_TIMEOUT_MS,
  DISMISS_RETRY_ATTEMPTS,
  DISMISS_RETRY_INTERVAL_MS,
} from '../constants';
import { TSheet, TSheetFlags } from '../types';
import { canDismiss, getGorhomStatus, logSheetDebug } from './utils';

export type UseSheetCloseParams = {
  /** Look up a live sheet record. */
  getSheet: (id: string) => TSheet | undefined;
  /** Look up a sheet's imperative handle. */
  getInstance: (id: string) => BottomSheetModal | undefined;
  /** Forget a sheet's imperative handle. */
  dropInstance: (id: string) => void;
  /** Merge flags into a sheet record (a no-op once it is gone). */
  updateSheetFlags: (id: string, flags: Partial<TSheetFlags>) => void;
  /** Take a sheet out of the stack. */
  removeSheet: (id: string) => void;
  /** Present every sheet held back by a closing one. */
  flushDeferredPresents: () => void;
};

export type UseSheetCloseResult = {
  /** Ask a sheet to close — the render API's `closeSheet`. */
  requestCloseSheet: (id: string) => void;
  /** Backdrop tap / header X on a sheet. */
  handleRequestClose: (sheet: TSheet) => void;
  /** Gorhom confirmed the teardown. */
  handleDismissed: (id: string) => void;
};

export function useSheetClose(props: UseSheetCloseParams): UseSheetCloseResult {
  const {
    getSheet,
    getInstance,
    dropInstance,
    updateSheetFlags,
    removeSheet,
    flushDeferredPresents,
  } = props;

  /**
   * False once the owner has unmounted, and the first thing everything below
   * checks.
   *
   * This is the one part of the provider that holds work for later: the retry
   * ticks, the per-frame poll, and the `onDismiss` Gorhom still owes us. All
   * three can land after the tree is gone, and the timers would otherwise
   * re-schedule themselves against sheets that no longer exist. Checking first
   * makes a late tick inert and ends the chain where it stands.
   */
  const liveRef = useRef(true);

  useEffect(
    () => () => {
      liveRef.current = false;
    },
    [],
  );

  /**
   * Deliver `options.onClose` at most once per sheet.
   *
   * At dismissal REQUEST time for user-initiated closes (backdrop tap / header
   * X) so a controlled sheet flips `isOpen` immediately and can be reopened
   * during the animation; at dismissal END for Gorhom-initiated closes.
   */
  const notifyClose = useCallback(
    (sheet: TSheet) => {
      if (sheet.closeNotified) {
        return;
      }

      updateSheetFlags(sheet.id, { closeNotified: true });
      sheet.options.onClose?.(sheet.id);
    },
    [updateSheetFlags],
  );

  /**
   * Drop a sheet: deliver `onClose` if it is still owed, forget its handle,
   * take it out of the stack, and unblock any present held back by a closing
   * sheet.
   *
   * The `onClose` delivery belongs here rather than at the call sites. This is
   * the last moment the record exists, it is the *only* notification a
   * Gorhom-initiated close (pan-down) ever gets, and a sheet closed by
   * `stackBehavior` is never notified at request time either. It is idempotent,
   * so the common path — backdrop tap, already notified when the close was
   * requested — is a no-op.
   *
   * Unmounting here does not hit the leak assumption 1 describes. Gorhom's
   * `handlePortalOnUnmount` only bails when the modal is still INITIAL, and
   * every caller is gated on a materialised status (`canDismiss` excludes
   * INITIAL). For a sheet that never settled, that teardown routes into
   * Gorhom's own `close()`, not the wedged `forceClose()` path.
   *
   * Called when Gorhom confirms the teardown, and — as a last resort — when it
   * never does and the sheet would otherwise stay on screen unclosable.
   */
  const dropSheet = useCallback(
    (id: string) => {
      const sheet = getSheet(id);

      if (sheet && !sheet.closeNotified) {
        notifyClose(sheet);
      }

      dropInstance(id);
      removeSheet(id);
      flushDeferredPresents();
    },
    [dropInstance, flushDeferredPresents, getSheet, notifyClose, removeSheet],
  );

  /**
   * Re-ask Gorhom to close a sheet that never confirmed: `dismiss()` can
   * silently do nothing and nothing notifies us, so the sheet would otherwise
   * sit there on screen forever. Re-asking is idempotent, and the budget is
   * finite — if it runs out the sheet is dropped, not rescued.
   */
  const closeWithRetry = useCallback(
    (id: string) => {
      let attemptsLeft = DISMISS_RETRY_ATTEMPTS;

      const check = () => {
        if (!liveRef.current) {
          return;
        }

        const sheet = getSheet(id);

        // Dismissed (and removed) meanwhile — nothing to re-ask.
        if (!sheet?.closing) {
          return;
        }

        const instance = getInstance(id);

        if (!instance) {
          return;
        }

        const status = getGorhomStatus(instance);

        if (attemptsLeft <= 0) {
          logSheetDebug('dismiss never confirmed', id, status);

          if (status === undefined) {
            // Nothing tells us the modal materialised, and an INITIAL modal must
            // not be unmounted (assumption 1). Leave it closable instead.
            updateSheetFlags(id, { closing: false, dismissed: false });
            flushDeferredPresents();
          } else {
            // The budget is gone and Gorhom never confirmed the teardown. Left
            // alone the sheet is a permanent, app-wide touch blocker: `closing`
            // blocks every close path and this provider lives for the whole app
            // session. Drop it — the caller already asked for it to close.
            dropSheet(id);
          }

          return;
        }

        attemptsLeft -= 1;

        // Re-asking while Gorhom is animating is dismissing mid-flight
        // (assumption 2): `forceClose()` no-ops and latches the sheet, which is
        // worse than the dropped call we are retrying. Keep watching, but wait
        // for the modal to settle rather than re-issue.
        if (!canDismiss(instance)) {
          logSheetDebug('dismiss retry skipped (not dismissable)', id, status);
        } else {
          logSheetDebug(
            `dismiss retry ${DISMISS_RETRY_ATTEMPTS - attemptsLeft}/${DISMISS_RETRY_ATTEMPTS}`,
            id,
            status,
          );

          instance.dismiss();
        }

        setTimeout(check, DISMISS_RETRY_INTERVAL_MS);
      };

      setTimeout(check, DISMISS_RETRY_INTERVAL_MS);
    },
    [dropSheet, flushDeferredPresents, getInstance, getSheet, updateSheetFlags],
  );

  /**
   * Close now: hand the dismissal over — only valid while `canDismiss`
   * (assumption 2).
   */
  const closeNow = useCallback(
    (id: string) => {
      const instance = getInstance(id);

      if (!instance) {
        return;
      }

      updateSheetFlags(id, { dismissed: true });
      logSheetDebug('dismiss', id);
      instance.dismiss();

      // Gorhom is dismissing now, so presenting is safe (assumption 3).
      flushDeferredPresents();
      closeWithRetry(id);
    },
    [closeWithRetry, flushDeferredPresents, getInstance, updateSheetFlags],
  );

  /**
   * Close as soon as Gorhom will accept it (assumption 2): closing mid-flight
   * re-enters its latched path, so re-check each frame until the deadline.
   */
  const closeWhenReady = useCallback(
    (id: string) => {
      const deadline = Date.now() + DISMISS_DEFER_TIMEOUT_MS;

      const attempt = () => {
        if (!liveRef.current) {
          return;
        }

        const sheet = getSheet(id);

        if (!sheet?.closing || sheet.dismissed) {
          return;
        }

        const instance = getInstance(id);

        if (!instance) {
          // Never materialised: nothing to animate out.
          removeSheet(id);
          flushDeferredPresents();

          return;
        }

        if (canDismiss(instance)) {
          closeNow(id);

          return;
        }

        // Cannot dismiss yet, and there is nothing to subscribe to: the status
        // that gates us only moves when Gorhom runs its own animation frames
        // (ANIMATING settles when the spring finishes), so poll — bounded by a
        // wall-clock deadline, which a slow JS thread or a high refresh rate
        // can't stretch.
        if (Date.now() < deadline) {
          requestAnimationFrame(attempt);

          return;
        }

        // Never became dismissable: stop treating it as closing so the sheet
        // stays closeable (a later tap can retry) instead of being latched.
        logSheetDebug('dismiss cancelled', id, getGorhomStatus(instance));
        updateSheetFlags(id, { closing: false });
        flushDeferredPresents();
      };

      requestAnimationFrame(attempt);
    },
    [
      closeNow,
      flushDeferredPresents,
      getInstance,
      getSheet,
      removeSheet,
      updateSheetFlags,
    ],
  );

  /**
   * Ask a sheet to close (no-op for unknown / already-closing ids). The sheet
   * stays mounted until Gorhom reports `onDismiss` (assumption 1).
   */
  const requestCloseSheet = useCallback(
    (id: string) => {
      if (!liveRef.current) {
        return;
      }

      const sheet = getSheet(id);

      if (!sheet || sheet.closing) {
        return;
      }

      const instance = getInstance(id);

      // Never reached the native layer: nothing to animate out, and removing it
      // from React cannot leak a portal entry.
      if (!sheet.presented || !instance) {
        logSheetDebug('remove (never presented)', id);
        removeSheet(id);
        flushDeferredPresents();

        return;
      }

      updateSheetFlags(id, { closing: true });

      if (!canDismiss(instance)) {
        logSheetDebug('dismiss deferred', id, getGorhomStatus(instance));
        closeWhenReady(id);

        return;
      }

      closeNow(id);
    },
    [
      closeNow,
      closeWhenReady,
      flushDeferredPresents,
      getInstance,
      getSheet,
      updateSheetFlags,
      removeSheet,
    ],
  );

  /** Backdrop tap / header X on a sheet. */
  const handleRequestClose = useCallback(
    (sheet: TSheet) => {
      if (!liveRef.current) {
        return;
      }

      notifyClose(sheet);
      requestCloseSheet(sheet.id);
    },
    [notifyClose, requestCloseSheet],
  );

  /**
   * Gorhom confirmed the teardown: the modal is gone, so drop the record.
   *
   * The counterpart to the give-up branch in `closeWithRetry`, which drops a
   * sheet Gorhom *never* confirmed.
   */
  const handleDismissed = useCallback(
    (id: string) => {
      if (!liveRef.current) {
        return;
      }

      dropSheet(id);
    },
    [dropSheet],
  );

  return {
    requestCloseSheet,
    handleRequestClose,
    handleDismissed,
  };
}
