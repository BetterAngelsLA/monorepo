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
  useCallback,
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
import { resolveBackdropSheetOptions } from './resolveBackdropSheetOptions';
import { TBottomSheetInstance } from './types.internal';
import { useBottomSheetSharedBackdrop } from './useBottomSheetSharedBackdrop';
import { useBottomSheetStack } from './useBottomSheetStack';

const EMPTY_SHEET_OPTIONS: BottomSheetOptions = {};

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

export function BottomSheetModalProvider(props: BottomSheetProviderProps) {
  const {
    children,
    defaultOptions,
    enableSharedBackdrop = false,
    enableLayoutProvider = true,
  } = props;

  const providerDefaults = useMemo<BottomSheetOptions>(
    () => defaultOptions ?? EMPTY_SHEET_OPTIONS,
    [defaultOptions]
  );

  const [closingSheetIds, setClosingSheetIds] = useState<Set<string>>(
    new Set()
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
   * Imperatively dismiss a sheet by id.
   * Safe no-op if instance not found.
   */
  const dismissSheetById = useCallback((id: string) => {
    const instance = sheetRefs.current.get(id);

    if (!instance) {
      return;
    }

    setClosingSheetIds((prev) => new Set(prev).add(id));

    instance.dismiss();
  }, []);

  const { addSheet } = useBottomSheetStack({
    sheetRefs,
    setSheets,
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
      [providerDefaults, enableSharedBackdrop, addSheet]
    );

  /**
   * Public API: popTopSheet
   *
   * Dismiss top sheet only.
   */
  const popTopSheet = useCallback(() => {
    setSheets((prev) => {
      if (prev.length === 0) {
        return prev;
      }

      const top = prev[prev.length - 1];
      const instance = sheetRefs.current.get(top.id);

      if (instance) {
        instance.dismiss();
      }

      return prev.slice(0, -1);
    });
  }, []);

  /**
   * Memoized context value.
   */
  const contextValue = useMemo(
    () => ({
      showBottomSheet,
      popTopSheet,
    }),
    [showBottomSheet, popTopSheet]
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
            <BottomSheetBase
              key={id}
              ref={(instance) => {
                if (!instance) {
                  return;
                }

                sheetRefs.current.set(id, instance);
                instance.present();
              }}
              options={options}
              keyboardBlurBehavior="restore"
              keyboardBehavior="interactive"
              onRequestClose={() => {
                dismissSheetById(id);
              }}
              onDismiss={() => {
                options.onClose?.();

                sheetRefs.current.delete(id);

                setClosingSheetIds((prev) => {
                  const next = new Set(prev);
                  next.delete(id);

                  return next;
                });

                setSheets((prev) => prev.filter((s) => s.id !== id));
              }}
            >
              {render({ closeSheet: () => dismissSheetById(id) })}
            </BottomSheetBase>
          ))}
        </BottomSheetContext.Provider>
      </LayoutWrapper>
    </GbsBottomSheetModalProvider>
  );
}
