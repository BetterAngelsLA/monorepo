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

import { ReactNode, useCallback, useEffect, useRef } from 'react';
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
  const isOpenRef = useRef(isOpen);

  // Mutable ref container to stabilize sheet inputs by render + lifecycle callbacks
  const stableInputsRef = useRef({
    children,
    options,
    onClose,
  });

  // Imperatively dismiss the current sheet without notifying `onClose`: the
  // parent either already knows it's closing (state-driven) or is gone
  // via `unmount`, so re-notifying it would be wrong.
  const dismissSheetFromState = useCallback(() => {
    if (!closeSheetRef.current) {
      return;
    }

    closingFromStateRef.current = true;
    closeSheetRef.current();
    closeSheetRef.current = null;
  }, []);

  useEffect(() => {
    stableInputsRef.current = { children, options, onClose };
  }, [children, options, onClose]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      dismissSheetFromState();

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
  }, [isOpen, showBottomSheet, dismissSheetFromState]);

  // Dismiss the sheet if this component unmounts while it is still open. The
  // provider owns the sheet lifecycle, so without this the sheet would linger
  // after its host component is gone (e.g. a per-item menu that unmounts).
  useEffect(() => {
    return () => {
      dismissSheetFromState();
    };
  }, [dismissSheetFromState]);

  return null;
}
