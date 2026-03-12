import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Dispatch, RefObject, useCallback } from 'react';
import { StackBehavior } from '../../types';
import { TBottomSheetInstance } from './types.internal';

type TParams = {
  sheetRefs: RefObject<Map<string, BottomSheetModal>>;
  setSheets: Dispatch<React.SetStateAction<TBottomSheetInstance[]>>;
};

export function useBottomSheetStack(params: TParams) {
  const { sheetRefs, setSheets } = params;

  const addSheet = useCallback(
    (instance: TBottomSheetInstance, stackBehavior: StackBehavior) => {
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
          const existing = sheetRefs.current.get(sheet.id);

          if (existing) {
            existing.dismiss();
          }
        });

        return [instance];
      });
    },
    [setSheets, sheetRefs]
  );

  return {
    addSheet,
  };
}
