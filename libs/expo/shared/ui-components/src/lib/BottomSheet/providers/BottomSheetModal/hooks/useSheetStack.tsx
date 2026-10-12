/**
 * useSheetStack
 *
 * Internal manager for the BottomSheet system.
 *
 * Responsibilities:
 * - Owns the sheet records and the stack order
 * - Controls presentation, and applies provider-level defaults
 * - Resolves options before rendering
 *
 * The other half of the lifecycle — asking sheets to close, and the dismissal
 * dance that follows — lives in `useSheetClose`, which this hook calls and
 * re-exposes. Splitting it keeps that pipeline from sitting at the same level
 * as the stack machinery that drives it.
 *
 * Consumed by `BottomSheetModalProvider`, which owns the rendering, and
 * re-exported to the app through `useBottomSheet` — see the hook for usage, and
 * the provider for the container and layout notes.
 *
 *
 * --------------------------------------------------------------------------
 * STACK SYSTEM
 * --------------------------------------------------------------------------
 *
 * Sheets are managed as a stack. `stackBehavior` decides what happens to the
 * sheets already open when a new one arrives, and `resolveSheetsToClose` is the
 * only place that rule is written down:
 *
 * - 'push'    → no one is closed; the new sheet opens on top
 * - 'switch'  → the sheet directly below the new one is closed
 * - 'replace' → every other live sheet is closed (default)
 *
 * Gorhom is not involved: `showBottomSheet` strips `stackBehavior` out of the
 * options before they reach it, so its own prop of that name goes unused. And
 * "closed" is not "unmounted" — a superseded sheet stays mounted until Gorhom
 * reports the dismissal finished (see SHEET LIFECYCLE below).
 *
 *
 * --------------------------------------------------------------------------
 * WHAT WE ASSUME ABOUT GORHOM (working notes — not authority)
 * --------------------------------------------------------------------------
 *
 * Notes about `@gorhom/bottom-sheet`, gathered from the version we pin and the
 * local patch. They are not guarantees: any of them can go stale on an upgrade,
 * a patch change, or a case nobody has hit yet. They explain why the lifecycle
 * below is shaped the way it is, and nothing more.
 *
 * The contract is `BottomSheetModalProvider.spec.tsx`, not this comment. If a
 * test and a line here disagree, the test is right and this comment is wrong.
 *
 *   Package  @gorhom/bottom-sheet 5.2.14
 *   Patch    .yarn/patches/@gorhom-bottom-sheet-npm-5.2.14-*.patch
 *
 * How far each one was checked:
 *   [read]    seen in the package source at that version
 *   [seen]    inferred from behaviour, not read in code
 *   [unread]  assumed, never checked — do not lean on it
 *
 * 1. Unmounting is only unsafe before the modal materialises.
 *    [read] `BottomSheetModal.handlePortalOnUnmount` returns early — leaving
 *    the modal alive — only while the status is still INITIAL. Every other
 *    status tears down: MINIMIZED/DISMISSED (or an index of -1) call
 *    `unmount()`, anything else hands off to `close()`.
 *    [seen] What that surviving modal looks like on screen — the "immortal,
 *    swallows every touch" freeze — is inferred from reports, not read out of
 *    the portal code.
 *    Here: a sheet that never reached `present()` is removed rather than
 *    dismissed, and `dropSheet` (in `useSheetClose`) also removes one Gorhom
 *    never confirmed.
 *
 * 2. A dismissal can wedge, and re-asking is how it gets worse.
 *    [read] `handleDismiss` sets the status to DISMISSING *before* animating,
 *    then calls `forceClose()`. So any `dismiss()` on a modal that has not
 *    settled re-enters that call — our own retries included. There is no error
 *    signal: a call either eventually produces `onDismiss`, or disappears.
 *    [read] A later `dismiss()` is not always a no-op: `handleDismiss` early-
 *    exits to `unmount()` for INITIAL, CLOSED, MINIMIZED and DISMISSED, and for
 *    DISMISSING once the index is -1. Our patch widened that set so a premature
 *    call tears down instead of latching (gorhom#2669).
 *    [unread] "`forceClose()` no-ops on a running animation or unmeasured
 *    detents, and never resets its latch" is a long-standing note about
 *    `BottomSheet` (not the modal) that has never been read. Folklore.
 *    Here: hand a dismissal over only when the modal has settled (`canDismiss`),
 *    re-ask only while it still has, and treat "never confirmed" as a bug to
 *    recover from rather than a state to accept. All of it in `useSheetClose`.
 *
 * 3. Presenting over an unfinished dismissal.
 *    [unread] We assume `mountSheet` would *minimize* a live modal instead of
 *    letting our dismissal finish, and that it skips that once a modal is
 *    DISMISSING — which is what lets a new sheet open while the old one slides
 *    away.
 *    Here: `maybePresent` holds a sheet back while another is closing but not
 *    yet handed over; `flushDeferredPresents` opens that gate.
 *
 * Also: no imperative work inside a state updater — React may re-invoke
 * updaters, and side effects there run during the render phase.
 *
 *
 * --------------------------------------------------------------------------
 * SHEET LIFECYCLE
 * --------------------------------------------------------------------------
 *
 * One `TSheet` record per live sheet, kept in `sheetsRef` (read synchronously
 * by commit-phase callbacks) and mirrored into `sheets` state for rendering.
 * Every flag lives on that record, so the flags can never disagree with each
 * other or with the rendered list:
 *
 *   add ─▶ register(instance) ─▶ present()
 *                                    │
 *                    close requested │ (backdrop/X, closeSheet, stack behavior)
 *                                    ▼
 *           requestCloseSheet() ─▶ onDismiss ─▶ removed from `sheets`
 *
 * `presented`     `present()` has been requested (fires once per sheet).
 * `closing`       close requested: out of the stack/backdrop, still mounted
 *                 because Gorhom has not confirmed teardown yet.
 * `dismissed`     the dismissal was handed to Gorhom — says nothing about
 *                 whether Gorhom finished (only meaningful while `closing`).
 * `closeNotified` `options.onClose` already delivered (at most once).
 *
 * The two "waiting" states are derived, never stored separately:
 *   awaiting present = mounted, not `presented`
 *   awaiting dismiss = `closing && !dismissed`
 */

import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BottomSheetContextValue,
  BottomSheetOptions,
  BottomSheetProviderConfig,
  ShowBottomSheetParams,
} from '../../../types';
import { resolveBottomSheetOptions } from '../../../utils/resolveBottomSheetOptions';
import { EMPTY_SHEET_OPTIONS, NEW_SHEET_FLAGS } from '../constants';
import { TSheet, TSheetFlags } from '../types';
import { useSheetClose } from './useSheetClose';
import {
  logSheetDebug,
  resolveSheetsToClose,
  sheetRef,
  useSheetDebugSnapshot,
} from './utils';

/**
 * Sheet ids only need to be unique to this provider. Using this format as it's
 * more useful in a debug trace.
 */
let sheetIdCounter = 0;

function generateSheetId(): string {
  sheetIdCounter += 1;

  return `sheet-${Date.now()}-${sheetIdCounter}`;
}

export type UseSheetStackResult = {
  /** Live sheets, in render order (last = top-most). */
  sheets: TSheet[];
  /** Gorhom's `ref` callback for a sheet. */
  register: (id: string, instance: BottomSheetModal | null) => void;
  /** The value `useBottomSheet()` exposes. */
  contextValue: BottomSheetContextValue;
  /** Backdrop tap / header X on a sheet. */
  handleRequestClose: (sheet: TSheet) => void;
  /** Gorhom confirmed the teardown. */
  handleDismissed: (id: string) => void;
  /** Ask a sheet to close — the render API's `closeSheet`. */
  requestCloseSheet: (id: string) => void;
};

export function useSheetStack(
  props: Pick<BottomSheetProviderConfig, 'defaultOptions'>,
): UseSheetStackResult {
  const { defaultOptions } = props;

  const providerDefaults = useMemo<BottomSheetOptions>(
    () => defaultOptions ?? EMPTY_SHEET_OPTIONS,
    [defaultOptions],
  );

  /**
   * Live sheets, in render order (last = top-most).
   *
   * `sheetsRef` is the authoritative copy so commit-phase callbacks (Gorhom's
   * `ref` callback, stable callbacks) can read and mutate it synchronously; the
   * state copy exists purely to re-render. Both are only ever written together,
   * through `commitSheets`.
   */
  const sheetsRef = useRef<TSheet[]>([]);
  const [sheets, setSheets] = useState<TSheet[]>([]);

  /**
   * Imperative handles, keyed by id. Deliberately not part of a record: the
   * `ref` callback re-attaches on every render, and writing to a ref must not
   * schedule a render.
   */
  const instancesRef = useRef<Map<string, BottomSheetModal>>(new Map());

  // Dev-only, one line per render — see ./utils/sheetDebug.
  useSheetDebugSnapshot(sheets, instancesRef);

  /**
   * Publish a new sheet list to both copies: the ref (read synchronously by
   * commit-phase callbacks) and React state (so the tree re-renders).
   */
  const commitSheets = useCallback((next: TSheet[]) => {
    sheetsRef.current = next;
    setSheets(next);
  }, []);

  const getSheet = useCallback(
    (id: string) => sheetsRef.current.find((sheet) => sheet.id === id),
    [],
  );

  /**
   * Apply a partial flag update to one sheet. No-op when the sheet is gone,
   * which is what makes every call site repeat-safe.
   */
  const updateSheetFlags = useCallback(
    (id: string, flags: Partial<TSheetFlags>) => {
      const currentSheets = sheetsRef.current;
      const index = currentSheets.findIndex((sheet) => sheet.id === id);

      if (index === -1) {
        return;
      }

      const next = currentSheets.slice();

      next[index] = { ...currentSheets[index], ...flags };
      commitSheets(next);
    },
    [commitSheets],
  );

  const removeSheet = useCallback(
    (id: string) => {
      commitSheets(sheetsRef.current.filter((sheet) => sheet.id !== id));
    },
    [commitSheets],
  );

  /**
   * Handle accessors. The `Map` itself stays private to this hook — the close
   * pipeline has no business knowing how handles are stored.
   */
  const getInstance = useCallback(
    (id: string) => instancesRef.current.get(id),
    [],
  );

  const dropInstance = useCallback((id: string) => {
    instancesRef.current.delete(id);
  }, []);

  /**
   * Present a sheet once it is allowed to present (assumption 3). Repeat-safe: a
   * sheet that is already presented, or has no handle yet, is left alone.
   */
  const maybePresent = useCallback(
    (id: string) => {
      const sheet = getSheet(id);
      const instance = getInstance(id);

      if (!sheet || !instance || sheet.presented) {
        return;
      }

      const blocking = sheetsRef.current.find(
        (candidate) => candidate.closing && !candidate.dismissed,
      );

      if (!blocking) {
        updateSheetFlags(id, { presented: true });
        logSheetDebug('present', id);
        instance.present();

        return;
      }

      // Held back by a dismissal Gorhom has not taken over yet (assumption 3).
      // Whoever opens that gate flushes this sheet — see
      // `flushDeferredPresents`.
      logSheetDebug(
        `present deferred (waiting on ${sheetRef(blocking.id)})`,
        id,
      );
    },
    [getInstance, getSheet, updateSheetFlags],
  );

  /**
   * Present every sheet still held back by a closing one. Called wherever that
   * gate opens: a dismissal handed to Gorhom, a sheet removed, or a dismissal
   * we gave up on.
   */
  const flushDeferredPresents = useCallback(() => {
    sheetsRef.current
      .filter((sheet) => !sheet.presented)
      .forEach((sheet) => maybePresent(sheet.id));
  }, [maybePresent]);

  /**
   * Forget handles for sheets that are no longer rendered (safety net: every
   * removal path drops its own handle).
   */
  useEffect(() => {
    const liveIds = new Set(sheets.map((sheet) => sheet.id));

    for (const id of Array.from(instancesRef.current.keys())) {
      if (!liveIds.has(id)) {
        instancesRef.current.delete(id);
      }
    }
  }, [sheets]);

  /**
   * Attach a sheet's imperative handle — Gorhom's `ref` callback, which React
   * re-invokes on every provider render, so this must be repeat-safe.
   */
  const register = useCallback(
    (id: string, instance: BottomSheetModal | null) => {
      if (!instance) {
        return;
      }

      const isNewHandle = getInstance(id) !== instance;

      instancesRef.current.set(id, instance);

      if (isNewHandle) {
        maybePresent(id);
      }
    },
    [getInstance, maybePresent],
  );

  /**
   * The close pipeline, re-exposed so everything downstream still sees a single
   * hook. It is handed accessors rather than the containers behind them: it has
   * no business knowing how records or handles are stored.
   */
  const { requestCloseSheet, handleRequestClose, handleDismissed } =
    useSheetClose({
      getSheet,
      getInstance,
      dropInstance,
      updateSheetFlags,
      removeSheet,
      flushDeferredPresents,
    });

  /**
   * Superseded sheets — the ones a newer sheet was opened on top of.
   *
   * This is an event, not derived state: a sheet becomes superseded the moment
   * a new top arrives, and never again. Keying the effect on the list instead
   * re-asks a sheet that already declined to close — the give-up path clears
   * `closing`, which puts it straight back into `resolveSheetsToClose`'s answer
   * — once per give-up, forever.
   */
  const topSheetId = sheets[sheets.length - 1]?.id;

  useEffect(() => {
    // Read through the ref: this must see the committed list, not a captured
    // one, and it must run on the commit that brought the new top in.
    resolveSheetsToClose(sheetsRef.current).forEach((sheet) =>
      requestCloseSheet(sheet.id),
    );
  }, [requestCloseSheet, topSheetId]);

  /**
   * Public API: showBottomSheet
   *
   * Resolves options and appends the sheet (last = top-most). Nothing is
   * presented here — the imperative handle arrives via the ref callback, which
   * calls `maybePresent`.
   */
  const showBottomSheet: BottomSheetContextValue['showBottomSheet'] =
    useCallback(
      (params: ShowBottomSheetParams) => {
        const { render, options } = params;

        const id = generateSheetId();

        const resolvedOptions = resolveBottomSheetOptions({
          ...providerDefaults,
          ...options,
        });

        const { stackBehavior = 'replace', ...instanceOptions } =
          resolvedOptions;

        commitSheets([
          ...sheetsRef.current,
          {
            id,
            render,
            options: instanceOptions,
            stackBehavior,
            ...NEW_SHEET_FLAGS,
          },
        ]);
      },
      [commitSheets, providerDefaults],
    );

  /**
   * Public API: popTopSheet
   *
   * Dismiss the top-most live sheet only.
   */
  const popTopSheet = useCallback(() => {
    const top = sheetsRef.current.filter((sheet) => !sheet.closing).pop();

    if (top) {
      requestCloseSheet(top.id);
    }
  }, [requestCloseSheet]);

  /**
   * Memoized context value.
   */
  const contextValue = useMemo(
    () => ({
      showBottomSheet,
      popTopSheet,
    }),
    [showBottomSheet, popTopSheet],
  );

  return {
    sheets,
    register,
    contextValue,
    handleRequestClose,
    handleDismissed,
    requestCloseSheet,
  };
}
