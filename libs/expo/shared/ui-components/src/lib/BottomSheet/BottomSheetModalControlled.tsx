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
  const isOpenRef = useRef(isOpen);
  const didQueueCloseRef = useRef(false);

  // Id of the sheet this component currently considers "open". Lets each
  // per-sheet onClose verify it belongs to the active sheet.
  const activeSheetIdRef = useRef<string | null>(null);

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
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      if (closeSheetRef.current) {
        closingFromStateRef.current = true;
        // Dying renders of this sheet must not re-queue a close.
        didQueueCloseRef.current = true;
        closeSheetRef.current();
        closeSheetRef.current = null;
      }

      // No active sheet while closed, so a reopen during the dismiss
      // animation starts a fresh presentation.
      activeSheetIdRef.current = null;

      return;
    }

    // Only one active sheet per open-cycle.
    if (activeSheetIdRef.current) {
      return;
    }

    closingFromStateRef.current = false;
    didQueueCloseRef.current = false;

    showBottomSheet({
      render: ({ closeSheet, id }) => {
        if (isOpenRef.current) {
          // Normal open render — claim this sheet.
          activeSheetIdRef.current = id;
          closeSheetRef.current = closeSheet;
          return stableInputsRef.current.children;
        }

        // Component is closed but this sheet mounted: either a mount-race
        // (presented right as isOpen flipped false) or a dying sheet. Only
        // the race queues a close, once.
        if (!didQueueCloseRef.current) {
          didQueueCloseRef.current = true;
          closingFromStateRef.current = true;
          activeSheetIdRef.current = id;
          closeSheetRef.current = closeSheet;
          queueMicrotask(() => closeSheetRef.current?.());
        }

        return stableInputsRef.current.children;
      },
      options: {
        ...(stableInputsRef.current.options ?? {}),
        onClose: (closingId: string) => {
          // A dismissal from a sheet that is no longer the active one (e.g. a
          // superseded sheet whose dismissal finished after a new one opened)
          // must not touch the shared refs or notify the parent.
          if (closingId !== activeSheetIdRef.current) {
            return;
          }

          activeSheetIdRef.current = null;
          closeSheetRef.current = null;
          didQueueCloseRef.current = false;

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
