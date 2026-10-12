/**
 * BottomSheetModalProvider
 *
 * Mounted once at the app root. Owns the rendering of the sheet stack; the
 * machinery — sheet records, the present/close lifecycle, stack behaviour —
 * lives in `useSheetStack`, along with the notes on what we assume about
 * Gorhom. Read those before touching the lifecycle.
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
 * CONTAINER NOTES
 * --------------------------------------------------------------------------
 *
 * Use `containerComponent` (globally or per-sheet) to control where the
 * sheet renders (e.g. FullWindowOverlay for navigation stacks).
 *
 * The contract for all of the above is the spec file beside this one: if a
 * test and a comment disagree, the test is right.
 */

import { BottomSheetModalProvider as GbsBottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Fragment, ReactNode } from 'react';
import { BottomSheetBase } from '../../core/BottomSheetBase';
import { BottomSheetProviderConfig } from '../../types';
import { BottomSheetLayoutProvider } from '../BottomSheetLayout/BottomSheetLayoutProvider';
import { BottomSheetContext } from './BottomSheetContext';
import { useSheetStack } from './hooks';

type BottomSheetProviderProps = BottomSheetProviderConfig & {
  children: ReactNode;
};

export function BottomSheetModalProvider(props: BottomSheetProviderProps) {
  const { children, enableLayoutProvider = true } = props;

  const {
    sheets,
    register,
    contextValue,
    handleRequestClose,
    handleDismissed,
    requestCloseSheet,
  } = useSheetStack(props);

  const LayoutWrapper = enableLayoutProvider
    ? BottomSheetLayoutProvider
    : Fragment;

  return (
    <GbsBottomSheetModalProvider>
      <LayoutWrapper>
        <BottomSheetContext.Provider value={contextValue}>
          {children}

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
                closeSheet: () => requestCloseSheet(sheet.id),
              })}
            </BottomSheetBase>
          ))}
        </BottomSheetContext.Provider>
      </LayoutWrapper>
    </GbsBottomSheetModalProvider>
  );
}
