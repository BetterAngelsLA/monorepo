/**
 * BottomSheetModalProvider
 *
 * Centralized BottomSheet manager.
 *
 * Responsibilities:
 * - Exposes context API (`showBottomSheet`, `popTopSheet`)
 * - Resolves sheet configuration via `resolveBottomSheetOptions`
 * - Manages stacking strategy (push | switch | replace)
 * - Controls sheet lifecycle (present / dismiss)
 * - Cleans up references on dismissal
 *
 * This layer does NOT:
 * - Know about header rendering
 * - Know about handle rendering
 * - Know about sheet styling
 *
 * All presentation concerns are delegated to `BottomSheetBase`.
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
  BottomSheetRenderApi,
  ShowBottomSheetParams,
} from '../types';
import { resolveBottomSheetOptions } from '../utils/resolveBottomSheetOptions';
import { BottomSheetContext } from './BottomSheetContext';

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

type TProps = {
  children: ReactNode;
};

export function BottomSheetModalProvider(props: TProps) {
  const { children } = props;

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
    useCallback((params: ShowBottomSheetParams) => {
      const { render, options } = params;

      const id = generateSheetId();

      const resolvedOptions = resolveBottomSheetOptions(options);

      const { stackBehavior = 'replace', ...instanceOptions } = resolvedOptions;

      const instance: TBottomSheetInstance = {
        id,
        render,
        options: instanceOptions,
      };

      setSheets((previousSheets) => {
        // Push → stack on top
        if (stackBehavior === 'push') {
          return [...previousSheets, instance];
        }

        // Switch → replace only the top sheet
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

        // Replace (default) → dismiss all existing sheets
        previousSheets.forEach((sheet) => {
          const inst = sheetRefs.current.get(sheet.id);

          if (inst) {
            inst.dismiss();
          }
        });

        return [instance];
      });
    }, []);

  /**
   * Public API: popTopSheet
   *
   * Dismisses the top-most sheet only.
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
