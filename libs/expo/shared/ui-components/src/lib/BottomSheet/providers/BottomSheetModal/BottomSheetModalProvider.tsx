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
 * - 'switch'  → dismiss top sheet, add new one on top
 * - 'replace' → dismiss all sheets, add new one on top (default)
 *
 * 'switch'/'replace' dismiss the outgoing sheet(s) but keep them in the stack
 * until each one reports `onDismiss` (deferred removal). That lets the dismiss
 * animation finish and the lifecycle cleanup run; dropping them from state
 * immediately unmounted them mid-animation and skipped `onDismiss`, leaving
 * the provider's bookkeeping stale and corrupting the next open/close cycle.
 *
 *
 * --------------------------------------------------------------------------
 * CONTAINER NOTES
 * --------------------------------------------------------------------------
 *
 * Use `containerComponent` (globally or per-sheet) to control where the
 * sheet renders. Nothing supplies one today: hosting sheets above a native
 * modal presentation was tried via react-native-screens' FullWindowOverlay and
 * abandoned — the sheet stack and its backdrops rendered out of order.
 *
 *
 * --------------------------------------------------------------------------
 * INTERNAL ARCHITECTURE
 * --------------------------------------------------------------------------
 *
 * Rendering:
 *   BottomSheetBase
 *
 * Option resolution:
 *   resolveBottomSheetOptions
 *
 * Stack management:
 *   useBottomSheetStack
 *
 * Shared backdrop:
 *   useBottomSheetSharedBackdrop
 */

import {
  BottomSheetModal,
  BottomSheetModalProvider as GbsBottomSheetModalProvider,
} from '@gorhom/bottom-sheet';
import {
  Fragment,
  ReactNode,
  RefObject,
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
  BottomSheetRenderApi,
  ShowBottomSheetParams,
} from '../../types';
import { resolveBottomSheetOptions } from '../../utils/resolveBottomSheetOptions';
import { BottomSheetLayoutProvider } from '../BottomSheetLayout/BottomSheetLayoutProvider';
import { BottomSheetContext } from './BottomSheetContext';
import { resolveBackdropSheetOptions } from './resolveBackdropSheetOptions';
import { TBottomSheetInstance } from './types.internal';
import { useBottomSheetSharedBackdrop } from './useBottomSheetSharedBackdrop';
import { useBottomSheetStack } from './useBottomSheetStack';

const EMPTY_SHEET_OPTIONS: BottomSheetOptions = {};

/**
 * How long to wait for gorhom to report `onDismiss` after a dismissal was
 * requested before force-removing the sheet. Guards against sheets — and the
 * native resources they own, e.g. a camera preview — leaking when the dismiss
 * animation is interrupted or never starts.
 */
const DISMISS_FORCE_REMOVE_TIMEOUT_MS = 2000;

/**
 * Simple incremental id generator for sheets.
 * Ensures stable keys and ref tracking.
 */
let sheetIdCounter = 0;

function generateSheetId(): string {
  sheetIdCounter += 1;

  return `sheet-${Date.now()}-${sheetIdCounter}`;
}

type BottomSheetProviderProps = BottomSheetProviderConfig & {
  children: ReactNode;
};

type SheetHostProps = {
  id: string;
  render: (api: BottomSheetRenderApi) => ReactNode;
  options: BottomSheetOptions;
  sheetRefs: RefObject<Map<string, BottomSheetModal>>;
  onRequestClose: () => void;
  onDismiss: () => void;
};

/**
 * Renders one sheet. The gorhom ref callback is memoized per sheet id so the
 * instance is presented exactly once, on mount: a fresh inline callback per
 * render would make React detach and re-attach the ref on every provider
 * render, re-invoking `present()` on sheets that are already mounted (or
 * mid-dismiss), which can fight the dismiss animation and stop `onDismiss`
 * from ever firing.
 */
function SheetHost(props: SheetHostProps) {
  const { id, render, options, sheetRefs, onRequestClose, onDismiss } = props;

  // The React Compiler memoizes this automatically; the gorhom ref callback is
  // stable for the lifetime of the sheet (id is fixed, the refs map is stable),
  // so the instance is presented exactly once, on mount. A fresh inline
  // callback per render would make React detach and re-attach the ref on every
  // provider render, re-invoking `present()` on sheets that are already
  // mounted (or mid-dismiss), which can fight the dismiss animation and stop
  // `onDismiss` from ever firing.
  function setSheetRef(instance: BottomSheetModal | null) {
    if (!instance) {
      sheetRefs.current.delete(id);

      return;
    }

    sheetRefs.current.set(id, instance);
    instance.present();
  }

  return (
    <BottomSheetBase
      ref={setSheetRef}
      options={options}
      keyboardBlurBehavior="restore"
      keyboardBehavior="interactive"
      onRequestClose={onRequestClose}
      onDismiss={onDismiss}
    >
      {render({ closeSheet: onRequestClose, id })}
    </BottomSheetBase>
  );
}

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

  const [closingSheetIds, setClosingSheetIds] = useState<Set<string>>(
    () => new Set(),
  );

  /**
   * Active sheets in render order.
   * Last item in array = top-most sheet.
   */
  const [sheets, setSheets] = useState<TBottomSheetInstance[]>([]);

  /**
   * Map of sheet id → gorhom instance.
   * Used for imperative dismissal.
   */
  const sheetRefs = useRef<Map<string, BottomSheetModal>>(new Map());

  /**
   * Live mirror of the stack for imperative lookups. Kept in sync by the
   * render effect below AND synchronously by the mutators (`addSheet`,
   * `removeSheet`) so that several mutations within the same tick chain
   * correctly.
   */
  const sheetsRef = useRef<TBottomSheetInstance[]>([]);

  useEffect(() => {
    sheetsRef.current = sheets;
  }, [sheets]);

  /**
   * Safety-valve timers armed by `requestDismiss`, cleared when the sheet
   * reports `onDismiss`.
   */
  const dismissTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  /**
   * Removes a sheet from the stack and runs its lifecycle cleanup.
   * This is the single place a sheet leaves the stack — both the gorhom
   * `onDismiss` path and the safety-valve force-removal funnel through here,
   * so cleanup can never be skipped.
   */
  const removeSheet = useCallback((id: string) => {
    const sheet = sheetsRef.current.find((s) => s.id === id);

    if (sheet) {
      sheet.options.onClose?.();
    }

    sheetRefs.current.delete(id);

    setClosingSheetIds((prev) => {
      if (!prev.has(id)) {
        return prev;
      }

      const next = new Set(prev);
      next.delete(id);

      return next;
    });

    const next = sheetsRef.current.filter((s) => s.id !== id);
    sheetsRef.current = next;
    setSheets(next);
  }, []);

  /**
   * Requests a sheet's dismissal and arms the safety valve.
   *
   * The sheet is intentionally NOT removed from the stack here: it stays
   * mounted so its dismiss animation completes and its `onDismiss` lifecycle
   * runs (see `removeSheet`). If gorhom never reports `onDismiss`, the safety
   * valve force-removes it so it cannot leak.
   */
  const requestDismiss = useCallback(
    (id: string) => {
      const instance = sheetRefs.current.get(id);

      if (!instance) {
        return;
      }

      setClosingSheetIds((prev) => new Set(prev).add(id));

      instance.dismiss();

      const existingTimer = dismissTimersRef.current.get(id);

      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      dismissTimersRef.current.set(
        id,
        setTimeout(() => {
          dismissTimersRef.current.delete(id);

          // Only force-remove if it is still in the stack — `onDismiss` may
          // already have cleaned it up.
          if (sheetsRef.current.some((s) => s.id === id)) {
            removeSheet(id);
          }
        }, DISMISS_FORCE_REMOVE_TIMEOUT_MS),
      );
    },
    [removeSheet],
  );

  /**
   * Imperatively dismiss a sheet by id.
   * Safe no-op if instance not found.
   */
  const dismissSheetById = useCallback(
    (id: string) => {
      requestDismiss(id);
    },
    [requestDismiss],
  );

  /**
   * Sheet dismissal lifecycle: clears the safety-valve timer and removes the
   * sheet from the stack (running its `onClose` cleanup).
   */
  const handleSheetDismiss = useCallback(
    (id: string) => {
      const timer = dismissTimersRef.current.get(id);

      if (timer) {
        clearTimeout(timer);
        dismissTimersRef.current.delete(id);
      }

      removeSheet(id);
    },
    [removeSheet],
  );

  const { addSheet } = useBottomSheetStack({
    sheetsRef,
    setSheets,
    dismissSheet: requestDismiss,
  });

  /**
   * Public API: showBottomSheet
   *
   * - Resolves options
   * - Applies stack behavior
   * - Adds new sheet instance to state
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

        const instance: TBottomSheetInstance = {
          id,
          render,
          options: instanceOptions,
        };

        addSheet(instance, stackBehavior);
      },
      [providerDefaults, enableSharedBackdrop, addSheet],
    );

  /**
   * Public API: popTopSheet
   *
   * Dismiss top sheet only. The sheet stays in the stack until its own
   * `onDismiss` removes it (deferred, like 'replace').
   */
  const popTopSheet = useCallback(() => {
    const top = sheetsRef.current[sheetsRef.current.length - 1];

    if (!top) {
      return;
    }

    requestDismiss(top.id);
  }, [requestDismiss]);

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

          {sheets.map(({ id, render, options }) => (
            <SheetHost
              key={id}
              id={id}
              render={render}
              options={options}
              sheetRefs={sheetRefs}
              onRequestClose={() => dismissSheetById(id)}
              onDismiss={() => handleSheetDismiss(id)}
            />
          ))}
        </BottomSheetContext.Provider>
      </LayoutWrapper>
    </GbsBottomSheetModalProvider>
  );
}
