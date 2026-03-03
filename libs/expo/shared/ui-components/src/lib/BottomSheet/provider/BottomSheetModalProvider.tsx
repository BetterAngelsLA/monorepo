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
import { ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { BottomSheetBase } from '../core/BottomSheetBase';
import {
  BottomSheetContextValue,
  BottomSheetOptions,
  BottomSheetProviderConfig,
  BottomSheetRenderApi,
  ShowBottomSheetParams,
} from '../types';
import { resolveBottomSheetOptions } from '../utils/resolveBottomSheetOptions';
import { BottomSheetContext } from './BottomSheetContext';

const EMPTY_SHEET_OPTIONS: BottomSheetOptions = {};

/**
 * Internal representation of an active sheet instance.
 *
 * - `id` uniquely identifies the sheet
 * - `render` is the caller-provided render function
 * - `options` is the fully resolved configuration object
 */
type TBottomSheetInstance = {
  id: string;
  render: (api: BottomSheetRenderApi) => ReactNode;
  options: BottomSheetOptions;
};

/**
 * Simple incremental id generator for sheets.
 * Ensures stable keys and ref tracking.
 */
let sheetIdCounter = 0;

function generateSheetId(): string {
  sheetIdCounter += 1;
  return `sheet-${sheetIdCounter}`;
}

type BottomSheetProviderProps = BottomSheetProviderConfig & {
  children: ReactNode;
};

export function BottomSheetModalProvider(props: BottomSheetProviderProps) {
  const { children, defaultOptions } = props;

  const providerDefaults = useMemo<BottomSheetOptions>(
    () => defaultOptions ?? EMPTY_SHEET_OPTIONS,
    [defaultOptions]
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

    instance.dismiss();
  }, []);

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
          ...options,
        };

        const resolvedOptions = resolveBottomSheetOptions(mergedOptions);

        const { stackBehavior = 'replace', ...instanceOptions } =
          resolvedOptions;

        const instance: TBottomSheetInstance = {
          id,
          render,
          options: instanceOptions,
        };

        setSheets((previousSheets) => {
          // Push: add stack on top
          if (stackBehavior === 'push') {
            return [...previousSheets, instance];
          }

          // Switch: replace the top sheet only
          if (stackBehavior === 'switch') {
            if (previousSheets.length > 0) {
              const top = previousSheets[previousSheets.length - 1];
              const topInstance = sheetRefs.current.get(top.id);

              if (topInstance) {
                topInstance.dismiss();
              }
            }

            return [...previousSheets.slice(0, -1), instance];
          }

          // Replace: dismiss all existing sheets (default)
          previousSheets.forEach((sheet) => {
            const inst = sheetRefs.current.get(sheet.id);

            if (inst) {
              inst.dismiss();
            }
          });

          return [instance];
        });
      },
      [providerDefaults]
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

  return (
    <GbsBottomSheetModalProvider>
      <BottomSheetContext.Provider value={contextValue}>
        {children}

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
            onRequestClose={() => dismissSheetById(id)}
            keyboardBlurBehavior="restore"
            keyboardBehavior="interactive"
            onDismiss={() => {
              options.onClose?.();

              sheetRefs.current.delete(id);
              setSheets((prev) => prev.filter((s) => s.id !== id));
            }}
          >
            {render({ closeSheet: () => dismissSheetById(id) })}
          </BottomSheetBase>
        ))}
      </BottomSheetContext.Provider>
    </GbsBottomSheetModalProvider>
  );
}
