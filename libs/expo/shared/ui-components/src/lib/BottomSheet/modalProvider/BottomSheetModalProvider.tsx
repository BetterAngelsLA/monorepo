import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetModalProvider as GbsBottomSheetModalProvider,
} from '@gorhom/bottom-sheet';
import { ReactNode, useCallback, useMemo, useRef, useState } from 'react';
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

  const dismissTopSheet = useCallback(() => {
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
      dismissTopSheet,
    }),
    [showBottomSheet, dismissTopSheet]
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
            enablePanDownToClose={options?.enablePanDownToClose ?? false}
            stackBehavior={options?.stackBehavior}
            maxDynamicContentSize={options?.maxHeight}
            snapPoints={options?.snapPoints}
            backgroundStyle={options?.backgroundStyle}
            handleComponent={null} // can customize later
            keyboardBlurBehavior={'restore'}
            keyboardBehavior="interactive"
            enableDynamicSizing={options?.enableDynamicSizing ?? true}
            backdropComponent={(backdropProps) => (
              <BottomSheetBackdrop
                {...backdropProps}
                disableBackdrop={options?.disableBackdrop}
                opacity={options?.backdropOpacity}
              />
            )}
            onDismiss={() => {
              sheetRefs.current.delete(id);
              setSheets((prev) => prev.filter((s) => s.id !== id));
            }}
            style={
              {
                // borderWidth: 4,
                // borderColor: 'blue',
                // borderTopLeftRadius: 24,
                // borderTopRightRadius: 24,
              }
            }
            contentStyle={{
              backgroundColor: 'red',
              borderWidth: 8,
              borderColor: 'black',
            }}
          >
            <BottomSheetView
              style={{
                borderWidth: 1,
                borderColor: 'red',
                borderTopLeftRadius: 84,
                borderTopRightRadius: 84,
                overflow: 'hidden',
                backgroundColor: 'yellow',
              }}
            >
              {render({ dismissTopSheet })}
            </BottomSheetView>
          </BaBottomSheetModal>
        ))}
      </BottomSheetContext.Provider>
    </GbsBottomSheetModalProvider>
  );
}
