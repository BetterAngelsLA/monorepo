/**
 * BottomSheetModalProvider
 *
 * Internal manager for the BottomSheet system.
 *
 * Responsibilities:
 * - Owns sheet state and stack
 * - Controls lifecycle (present / dismiss)
 * - Applies provider-level defaults
 * - Resolves options before rendering
 * - Coordinates shared backdrop + layout system
 *
 * This provider should be mounted once at the app root.
 *
 * --------------------------------------------------------------------------
 * USAGE
 * --------------------------------------------------------------------------
 *
 * Do NOT interact with this provider directly.
 *
 * Use `useBottomSheet()` instead:
 *
 *   const { showBottomSheet } = useBottomSheet();
 *
 * See `useBottomSheet` for full API documentation and examples.
 *
 *
 * --------------------------------------------------------------------------
 * STACK SYSTEM
 * --------------------------------------------------------------------------
 *
 * Sheets are managed as a stack. The behavior is controlled via
 * `stackBehavior`:
 *
 * - 'push'    → add on top
 * - 'switch'  → replace top sheet
 * - 'replace' → clear stack (default)
 *
 *
 * --------------------------------------------------------------------------
 * CONTAINER NOTES
 * --------------------------------------------------------------------------
 *
 * Use `containerComponent` (globally or per-sheet) to control where the
 * sheet renders (e.g. FullWindowOverlay for navigation stacks).
 *
 *
 * --------------------------------------------------------------------------
 * GORHOM GOTCHAS (read before touching the lifecycle)
 * --------------------------------------------------------------------------
 *
 * Gorhom renders each modal through `@gorhom/portal`: the modal is mounted by
 * the portal HOST — a different tree from the component that owns it. Together
 * with a few silent no-ops in its state machine that gives us three rules:
 *
 * 1. NEVER unmount a sheet from React. If the owner unmounts before Gorhom
 *    finishes its own teardown, its `handlePortalOnUnmount` bails out on
 *    INITIAL, the portal entry is never removed, and the modal keeps living on
 *    screen with our last props — immortal, unclosable, swallowing every touch
 *    (the "UI freeze"). So a sheet leaves `sheets` only when Gorhom confirms
 *    the teardown (`onDismiss`), or when it never reached the native layer.
 *
 * 2. NEVER dismiss mid-flight. `handleDismiss` latches its status to
 *    DISMISSING *before* animating, and its `forceClose()` silently no-ops if
 *    it has to stop a running animation (its `isForcedClosing` latch is then
 *    never reset) or if the detents aren't measured yet. The sheet stays on
 *    screen forever with no `onClose`/`onDismiss`, and no later `dismiss()`
 *    does anything. We dismiss only once the modal has settled, and re-ask a
 *    few times in case a call was dropped. Deferring beats dropping a request:
 *    by the time we know we cannot dismiss, the caller's state has moved on
 *    (a controlled sheet flipped `isOpen`, the wrapper cleared its refs).
 *
 * 3. NEVER present over a sheet that is closing but has NOT been handed to
 *    Gorhom yet: that modal is still live, so Gorhom's `mountSheet` would
 *    *minimize* it instead of letting our dismissal finish. Once a dismissal is
 *    running, presenting is safe — Gorhom skips its minimize/replace handling
 *    for a DISMISSING modal — and it keeps the UI snappy: "Take Photo" opens
 *    the camera sheet while the menu slides away.
 *
 * Upstream: gorhom#2669 / #2713, plus the local Yarn patch that makes
 * `dismiss()` on INITIAL/DISMISSED tear down instead of latching.
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
 *                     dismiss() ─▶ onDismiss ─▶ removed from `sheets`
 *
 * `presented`     `present()` has been requested (fires once per sheet).
 * `closing`       close requested: out of the stack/backdrop, still mounted
 *                 because Gorhom has not confirmed teardown yet.
 * `dismissed`     `dismiss()` handed to Gorhom (only meaningful while closing).
 * `closeNotified` `options.onClose` already delivered (at most once).
 *
 * The two "waiting" states are derived, never stored separately:
 *   awaiting present = mounted, not `presented`
 *   awaiting dismiss = `closing && !dismissed`
 */

import {
  BottomSheetModal,
  BottomSheetModalProvider as GbsBottomSheetModalProvider,
} from '@gorhom/bottom-sheet';
import {
  Fragment,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { BottomSheetBase } from '../../core/BottomSheetBase';
import {
  BottomSheetContextValue,
  BottomSheetOptions,
  BottomSheetProviderConfig,
  ShowBottomSheetParams,
} from '../../types';
import { resolveBottomSheetOptions } from '../../utils/resolveBottomSheetOptions';
import { BottomSheetLayoutProvider } from '../BottomSheetLayout/BottomSheetLayoutProvider';
import { BottomSheetContext } from './BottomSheetContext';
import {
  DISMISS_DEFER_TIMEOUT_MS,
  DISMISS_RETRY_ATTEMPTS,
  DISMISS_RETRY_INTERVAL_MS,
  EMPTY_SHEET_OPTIONS,
  NEW_SHEET_FLAGS,
} from './constants';
import { TSheet, TSheetFlags } from './types';
import { useBottomSheetSharedBackdrop } from './useBottomSheetSharedBackdrop';
import {
  canDismiss,
  getGorhomStatus,
  logSheetDebug,
  resolveBackdropSheetOptions,
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

type BottomSheetProviderProps = BottomSheetProviderConfig & {
  children: ReactNode;
};

export function BottomSheetModalProvider(props: BottomSheetProviderProps) {
  const {
    children,
    defaultOptions,
    enableSharedBackdrop = false,
    enableLayoutProvider = true,
  } = props;

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

  // Dev-only, one line per render — see utils/sheetDebug.
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
   * Present a sheet once it is allowed to present (rule 3). Repeat-safe: a
   * sheet that is already presented, or has no handle yet, is left alone.
   */
  const maybePresent = useCallback(
    (id: string) => {
      const sheet = getSheet(id);
      const instance = instancesRef.current.get(id);

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

      // Held back by a dismissal Gorhom has not taken over yet (rule 3).
      // Whoever opens that gate flushes this sheet — see
      // `flushDeferredPresents`.
      logSheetDebug(
        `present deferred (waiting on ${sheetRef(blocking.id)})`,
        id,
      );
    },
    [getSheet, updateSheetFlags],
  );

  /**
   * Present every sheet still waiting on the rule-3 gate. Called wherever that
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
   * Re-ask Gorhom to dismiss a sheet that never confirmed: `dismiss()` can
   * silently do nothing and nothing notifies us, so the sheet would otherwise
   * sit there on screen forever. Re-asking is idempotent.
   */
  const watchDismissal = useCallback(
    (id: string) => {
      let attemptsLeft = DISMISS_RETRY_ATTEMPTS;

      const check = () => {
        const sheet = getSheet(id);

        // Dismissed (and removed) meanwhile — nothing to re-ask.
        if (!sheet?.closing) {
          return;
        }

        const instance = instancesRef.current.get(id);

        if (!instance) {
          return;
        }

        if (attemptsLeft <= 0) {
          logSheetDebug(
            'dismiss never confirmed',
            id,
            getGorhomStatus(instance),
          );

          return;
        }

        attemptsLeft -= 1;
        logSheetDebug(
          `dismiss retry ${DISMISS_RETRY_ATTEMPTS - attemptsLeft}/${DISMISS_RETRY_ATTEMPTS}`,
          id,
          getGorhomStatus(instance),
        );
        instance.dismiss();

        setTimeout(check, DISMISS_RETRY_INTERVAL_MS);
      };

      setTimeout(check, DISMISS_RETRY_INTERVAL_MS);
    },
    [getSheet],
  );

  /** Hand the dismissal to Gorhom — only valid while `canDismiss` (rule 2). */
  const dismissNow = useCallback(
    (id: string) => {
      const instance = instancesRef.current.get(id);

      if (!instance) {
        return;
      }

      updateSheetFlags(id, { dismissed: true });
      logSheetDebug('dismiss', id);
      instance.dismiss();

      // Gorhom is dismissing now, so presenting is safe (rule 3).
      flushDeferredPresents();
      watchDismissal(id);
    },
    [flushDeferredPresents, updateSheetFlags, watchDismissal],
  );

  /**
   * Dismiss as soon as Gorhom accepts it (rule 2): dismissing mid-flight latches
   * its status, so re-check each frame until the deadline.
   */
  const dismissWhenReady = useCallback(
    (id: string) => {
      const deadline = Date.now() + DISMISS_DEFER_TIMEOUT_MS;

      const attempt = () => {
        const sheet = getSheet(id);

        if (!sheet?.closing || sheet.dismissed) {
          return;
        }

        const instance = instancesRef.current.get(id);

        if (!instance) {
          // Never materialised: nothing to animate out.
          removeSheet(id);
          flushDeferredPresents();

          return;
        }

        if (canDismiss(instance)) {
          dismissNow(id);

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
      dismissNow,
      flushDeferredPresents,
      getSheet,
      updateSheetFlags,
      removeSheet,
    ],
  );

  /**
   * Request dismissal of a sheet (no-op for unknown / already-closing ids). The
   * sheet stays mounted until Gorhom reports `onDismiss` (rule 1).
   */
  const dismiss = useCallback(
    (id: string) => {
      const sheet = getSheet(id);

      if (!sheet || sheet.closing) {
        return;
      }

      const instance = instancesRef.current.get(id);

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
        dismissWhenReady(id);

        return;
      }

      dismissNow(id);
    },
    [
      dismissNow,
      dismissWhenReady,
      flushDeferredPresents,
      getSheet,
      updateSheetFlags,
      removeSheet,
    ],
  );

  /**
   * Attach a sheet's imperative handle — Gorhom's `ref` callback, which React
   * re-invokes on every provider render, so this must be repeat-safe.
   */
  const register = useCallback(
    (id: string, instance: BottomSheetModal | null) => {
      if (!instance) {
        return;
      }

      const isNewHandle = instancesRef.current.get(id) !== instance;

      instancesRef.current.set(id, instance);

      if (isNewHandle) {
        maybePresent(id);
      }
    },
    [maybePresent],
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

  /** Backdrop tap / header X on a sheet. */
  const handleRequestClose = useCallback(
    (sheet: TSheet) => {
      notifyClose(sheet);
      dismiss(sheet.id);
    },
    [dismiss, notifyClose],
  );

  /**
   * Gorhom confirmed teardown — the only point at which unmounting is safe
   * (rule 1), and how a Gorhom-initiated close (e.g. pan-down) reaches us.
   */
  const handleDismissed = useCallback(
    (id: string) => {
      const sheet = getSheet(id);

      if (sheet && !sheet.closeNotified) {
        notifyClose(sheet);
      }

      instancesRef.current.delete(id);
      removeSheet(id);
      flushDeferredPresents();
    },
    [flushDeferredPresents, getSheet, notifyClose, removeSheet],
  );

  /** Sheets that must close because a newer sheet was opened on top of them. */
  const sheetsToClose = useMemo(() => resolveSheetsToClose(sheets), [sheets]);

  useEffect(() => {
    sheetsToClose.forEach((sheet) => dismiss(sheet.id));
  }, [dismiss, sheetsToClose]);

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

        const mergedOptions: BottomSheetOptions = {
          ...providerDefaults,
          ...resolveBackdropSheetOptions(enableSharedBackdrop, options),
        };

        const resolvedOptions = resolveBottomSheetOptions(mergedOptions);

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
      [commitSheets, providerDefaults, enableSharedBackdrop],
    );

  /**
   * Public API: popTopSheet
   *
   * Dismiss the top-most live sheet only.
   */
  const popTopSheet = useCallback(() => {
    const top = sheetsRef.current.filter((sheet) => !sheet.closing).pop();

    if (top) {
      dismiss(top.id);
    }
  }, [dismiss]);

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

  /** Ids of sheets that are closing (the shared backdrop hides while any exist). */
  const closingSheetIds = useMemo(
    () => new Set(sheets.filter((sheet) => sheet.closing).map((s) => s.id)),
    [sheets],
  );

  const sharedBackdrop = useBottomSheetSharedBackdrop({
    enabled: enableSharedBackdrop,
    Container: providerDefaults.containerComponent,
    sheets,
    closingSheetIds,
    popTopSheet,
  });

  const LayoutWrapper = enableLayoutProvider
    ? BottomSheetLayoutProvider
    : Fragment;

  return (
    <GbsBottomSheetModalProvider>
      <LayoutWrapper>
        <BottomSheetContext.Provider value={contextValue}>
          {children}

          {sharedBackdrop.render()}

          {/*
            register only ever runs from the ref callback (commit phase), but
            the compiler lint can't distinguish that from a render-phase ref
            access and flags the map expression below.
          */}
          {/* eslint-disable-next-line react-hooks/refs */}
          {sheets.map((sheet) => (
            <BottomSheetBase
              key={sheet.id}
              ref={(instance) => register(sheet.id, instance)}
              options={sheet.options}
              keyboardBlurBehavior="restore"
              keyboardBehavior="interactive"
              onRequestClose={() => handleRequestClose(sheet)}
              onDismiss={() => handleDismissed(sheet.id)}
            >
              {sheet.render({
                id: sheet.id,
                closeSheet: () => dismiss(sheet.id),
              })}
            </BottomSheetBase>
          ))}
        </BottomSheetContext.Provider>
      </LayoutWrapper>
    </GbsBottomSheetModalProvider>
  );
}
