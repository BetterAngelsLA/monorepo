/**
 * BottomSheetModalProvider
 *
 * Centralized BottomSheet manager responsible for coordinating
 * the lifecycle, stacking behavior, and configuration of all
 * BottomSheet modals within the application.
 *
 * Responsibilities:
 * - Exposes context API (`showBottomSheet`, `popTopSheet`)
 * - Applies provider-level default options
 * - Resolves sheet configuration via `resolveBottomSheetOptions`
 * - Manages sheet stacking strategy (push | switch | replace)
 * - Controls sheet lifecycle (present / dismiss)
 * - Cleans up internal references when sheets are dismissed
 *
 * This provider implements a **stack-based sheet system**:
 *
 * - Multiple sheets may exist simultaneously
 * - The last sheet in the stack is the visible/top sheet
 * - `stackBehavior` determines how new sheets interact with existing ones
 *
 *
 * --------------------------------------------------------------------------
 * DEFAULT OPTIONS
 * --------------------------------------------------------------------------
 *
 * The provider may define `defaultOptions` that apply to every sheet
 * opened via `showBottomSheet()`.
 *
 * These defaults are merged with options passed directly to
 * `showBottomSheet()`.
 *
 * Resolution order:
 *
 *   provider defaultOptions
 *     → showBottomSheet options
 *       → resolveBottomSheetOptions()
 *
 *
 * --------------------------------------------------------------------------
 * PRESENTATION LAYER
 * --------------------------------------------------------------------------
 *
 * All rendering responsibilities are delegated to `BottomSheetBase`.
 *
 *
 * --------------------------------------------------------------------------
 * CONTAINER OVERRIDES
 * --------------------------------------------------------------------------
 *
 * In certain navigation setups (for example React Navigation modal screens),
 * BottomSheet may render behind the current screen due to how native
 * screens manage view hierarchies.
 *
 * This can be resolved by providing a custom `containerComponent`,
 * such as `BottomSheetFullScreenContainer`, which renders the sheet
 * inside `FullWindowOverlay`.
 *
 * This option can be configured globally via `defaultOptions`
 * or overridden per sheet via `showBottomSheet()`.
 *
 *
 * --------------------------------------------------------------------------
 * USAGE EXAMPLES
 * --------------------------------------------------------------------------
 *
 * *******************
 * *** Basic sheet ***
 * *******************
 *
 * showBottomSheet({
 *   render: () => <SimpleContent />,
 * });
 *
 *
 * *****************************************************
 * *** Sheet with snap points (handle auto-resolved) ***
 * *****************************************************
 *
 * showBottomSheet({
 *   options: {
 *     snapPoints: ['50%', '90%'],
 *   },
 *   render: () => <ScrollableContent />,
 * });
 *
 *
 * ******************************************
 * *** Menu-style sheet with close button ***
 * ******************************************
 *
 * showBottomSheet({
 *   options: {
 *     showCloseButton: true,
 *     headerContent: <Text variant="h4">Menu</Text>,
 *   },
 *   render: ({ closeSheet }) => (
 *     <Menu onSelect={() => closeSheet()} />
 *   ),
 * });
 *
 *
 * *******************************************
 * *** Form-style sheet with custom layout ***
 * *******************************************
 *
 * showBottomSheet({
 *   options: {
 *     showCloseButton: true,
 *     contentStyle: { padding: 0 },
 *     headerStyle: { paddingHorizontal: 16 },
 *   },
 *   render: ({ closeSheet }) => (
 *     <CustomFileNamePrompt
 *       onSubmit={(value) => {
 *         console.log(value);
 *         closeSheet();
 *       }}
 *     />
 *   ),
 * });
 *
 *
 * *******************************
 * *** Stack behavior examples ***
 * *******************************
 *
 * // Push on top
 * showBottomSheet({
 *   options: { stackBehavior: 'push' },
 *   render: () => <AnotherSheet />,
 * });
 *
 * // Replace all existing sheets (default)
 * showBottomSheet({
 *   options: { stackBehavior: 'replace' },
 *   render: () => <SingleSheet />,
 * });
 *
 * // Replace only the top sheet
 * showBottomSheet({
 *   options: { stackBehavior: 'switch' },
 *   render: () => <ReplacementSheet />,
 * });
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
