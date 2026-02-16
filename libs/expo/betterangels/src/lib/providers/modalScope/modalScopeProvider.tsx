/**
 * ModalScope defines the UI overlay universe for a native modal.
 *
 * Any provider placed here is guaranteed to render its UI
 * above the modal’s content, but will not escape this modal.
 *
 * Only visual, interaction-level providers should live here
 * (e.g. Snackbar, BottomPrompt).
 */

import { BottomSheetModalProvider } from '@monorepo/expo/shared/ui-components';
import { ReactNode } from 'react';
import SnackbarProvider from '../snackbar/SnackbarProvider';

export function ModalScopeProvider({ children }: { children: ReactNode }) {
  return (
    <BottomSheetModalProvider>
      <SnackbarProvider>{children}</SnackbarProvider>
    </BottomSheetModalProvider>
  );
}
