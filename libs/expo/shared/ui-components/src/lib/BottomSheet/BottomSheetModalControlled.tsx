/**
 * BottomSheetModalControlled
 *
 * Declarative wrapper around the BottomSheet provider API.
 *
 * This component allows a BottomSheet to be controlled using a simple
 * `isOpen` boolean instead of calling `showBottomSheet()` imperatively.
 *
 * Typical usage:
 *
 *   <BottomSheetModalControlled
 *     isOpen={isMenuOpen}
 *     onClose={() => setIsMenuOpen(false)}
 *   >
 *     <SomeMenu />
 *   </BottomSheetModalControlled>
 *
 * Notes:
 * - The sheet content is rendered through the provider's stacking system.
 * - The component itself renders null.
 * - `options` are forwarded to `showBottomSheet()`
 */

import { ReactNode, useEffect, useRef } from 'react';
import { useBottomSheet } from './providers/BottomSheetModal/useBottomSheet';
import { BottomSheetOptions } from './types';

type TProps = {
  isOpen: boolean;
  children: ReactNode;
  onClose?: () => void;
  options?: BottomSheetOptions;
};

export function BottomSheetModalControlled(props: TProps) {
  const { isOpen, onClose, children, options } = props;
  const { showBottomSheet } = useBottomSheet();

  const closeSheetRef = useRef<(() => void) | null>(null);
  const closingFromStateRef = useRef(false);

  // Mutable ref container to stabilize sheet inputs by render + lifecycle callbacks
  const stableInputsRef = useRef({
    children,
    options,
    onClose,
  });

  useEffect(() => {
    stableInputsRef.current = { children, options, onClose };
  }, [children, options, onClose]);

  useEffect(() => {
    if (!isOpen) {
      if (closeSheetRef.current) {
        closingFromStateRef.current = true;
        closeSheetRef.current();
        closeSheetRef.current = null;
      }

      return;
    }

    if (closeSheetRef.current) {
      return;
    }

    showBottomSheet({
      render: ({ closeSheet }) => {
        closeSheetRef.current = closeSheet;

        return stableInputsRef.current.children;
      },
      options: {
        ...(stableInputsRef.current.options ?? {}),
        onClose: () => {
          closeSheetRef.current = null;

          // only notify parent if sheet initiated the close
          if (!closingFromStateRef.current) {
            stableInputsRef.current.onClose?.();
          }

          closingFromStateRef.current = false;
        },
      },
    });
  }, [isOpen, showBottomSheet]);

  return null;
}
