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
  onRequestClose?: () => void;
  options?: BottomSheetOptions;
};

export function BottomSheetModalControlled(props: TProps) {
  const { isOpen, onClose, onRequestClose, children, options } = props;
  const { showBottomSheet } = useBottomSheet();

  const closeSheetRef = useRef<(() => void) | null>(null);
  const closingFromStateRef = useRef(false);
  const isOpenRef = useRef(isOpen);

  // Mutable ref container to stabilize sheet inputs by render + lifecycle callbacks
  const stableInputsRef = useRef({
    children,
    options,
    onClose,
    onRequestClose,
  });

  useEffect(() => {
    stableInputsRef.current = {
      children,
      options,
      onClose,
      onRequestClose,
    };
  }, [children, options, onClose, onRequestClose]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

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

        // The sheet can mount after `isOpen` has already flipped back to
        // false (e.g. a selection closed the picker while the sheet was still
        // presenting). Dismiss it right away so it never lingers open.
        if (!isOpenRef.current) {
          closingFromStateRef.current = true;
          queueMicrotask(() => closeSheetRef.current?.());
        }

        return stableInputsRef.current.children;
      },
      options: {
        ...(stableInputsRef.current.options ?? {}),
        onRequestClose: () => {
          // Only notify the parent when the USER initiated the close
          // (button, backdrop, swipe). Programmatic closes set
          // closingFromStateRef before dismissing, so they're skipped here.
          if (!closingFromStateRef.current) {
            stableInputsRef.current.onRequestClose?.();
          }
        },
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
