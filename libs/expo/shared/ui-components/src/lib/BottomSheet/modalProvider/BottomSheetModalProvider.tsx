/**
 * Centralized BottomSheet manager.
 *
 * Provides a context-based API to open, stack, switch, and dismiss
 * BottomSheet modals without coupling callers to gorhom internals.
 *
 * Responsible for instance lifecycle, stacking strategy, and backdrop behavior.
 */

import {
  BottomSheetModal,
  BottomSheetModalProvider as GbsBottomSheetModalProvider,
} from '@gorhom/bottom-sheet';
import { Radiuses } from '@monorepo/expo/shared/static';
import { ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { BottomSheetBackdrop } from '../BottomSheetBackdrop';
import { BottomSheetModal as BaBottomSheetModal } from '../BottomSheetModal';
import {
  BottomSheetContextValue,
  BottomSheetOptions,
  BottomSheetRenderApi,
  ShowBottomSheetParams,
} from '../types';
import { BottomSheetContext } from './BottomSheetContext';

type TBottomSheetInstance = {
  id: string;
  render: (api: BottomSheetRenderApi) => ReactNode;
  options?: ShowBottomSheetParams['options'];
};

let sheetIdCounter = 0;

function generateSheetId(): string {
  const id = (sheetIdCounter += 1);

  return `sheet-${id}`;
}

type TProps = {
  children: ReactNode;
};

export function BottomSheetModalProvider(props: TProps) {
  const { children } = props;

  const [sheets, setSheets] = useState<TBottomSheetInstance[]>([]);
  const sheetRefs = useRef<Map<string, BottomSheetModal>>(new Map());

  const dismissSheetById = useCallback((id: string) => {
    const instance = sheetRefs.current.get(id);

    if (!instance) {
      return;
    }

    instance.dismiss();
  }, []);

  const showBottomSheet: BottomSheetContextValue['showBottomSheet'] =
    useCallback(
      (
        render: (api: BottomSheetRenderApi) => ReactNode,
        options?: BottomSheetOptions
      ) => {
        const id = generateSheetId();

        const { stackBehavior = 'replace', ...renderOptions } = options ?? {};

        const instanceOpts: TBottomSheetInstance = {
          id,
          render,
          options: renderOptions,
        };

        setSheets((previousSheets) => {
          // stack on top
          if (stackBehavior === 'push') {
            return [...previousSheets, instanceOpts];
          }

          // switch last
          if (stackBehavior === 'switch') {
            if (previousSheets.length > 0) {
              const top = previousSheets[previousSheets.length - 1];
              const topInstance = sheetRefs.current.get(top.id);

              if (topInstance) {
                topInstance.dismiss();
              }
            }

            const remainingSheets = previousSheets.slice(0, -1);

            return [...remainingSheets, instanceOpts];
          }

          // replace (default)
          previousSheets.forEach((sheet) => {
            const instance = sheetRefs.current.get(sheet.id);

            if (instance) {
              instance.dismiss();
            }
          });

          return [instanceOpts];
        });
      },
      []
    );

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
          <BaBottomSheetModal
            key={id}
            ref={(instance) => {
              if (instance) {
                sheetRefs.current.set(id, instance);
                instance.present();
              }
            }}
            onRequestClose={() => dismissSheetById(id)}
            enablePanDownToClose={options?.enablePanDownToClose ?? false}
            stackBehavior={options?.stackBehavior}
            maxDynamicContentSize={options?.maxHeight}
            snapPoints={options?.snapPoints}
            enableDynamicSizing={options?.enableDynamicSizing ?? true}
            scrollable={options?.scrollable}
            keyboardBlurBehavior="restore"
            keyboardBehavior="interactive"
            handleComponent={null} // can customize later
            backdropComponent={(backdropProps) => (
              <BottomSheetBackdrop
                {...backdropProps}
                disableBackdrop={options?.disableBackdrop}
                opacity={options?.backdropOpacity}
              />
            )}
            // triggered on Swipe down or programmatic dismissal
            onDismiss={() => {
              sheetRefs.current.delete(id);
              setSheets((prev) => prev.filter((s) => s.id !== id));
            }}
            backgroundStyle={[styles.backgroundStyle, options?.backgroundStyle]}
          >
            {render({ closeSheet: () => dismissSheetById(id) })}
          </BaBottomSheetModal>
        ))}
      </BottomSheetContext.Provider>
    </GbsBottomSheetModalProvider>
  );
}

const styles = StyleSheet.create({
  backgroundStyle: {
    borderTopRightRadius: Radiuses.md,
    borderTopLeftRadius: Radiuses.md,
  },
});
