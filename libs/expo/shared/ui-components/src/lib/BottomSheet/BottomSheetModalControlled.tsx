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

/**
 * One generation of a sheet. The provider assigns a fresh `id` per
 * `showBottomSheet()` call, so a rapid re-open creates a NEW handle while the
 * previous sheet is still dismissing. Bookkeeping must only ever touch the
 * handle belonging to the sheet it is reacting to — a stale `onDismiss` from
 * an older generation must not clobber the newer sheet's close handle (that
 * orphaned the newer sheet and leaked whatever it owned, e.g. a camera).
 */
type TSheetHandle = {
  id: string;
  close: () => void;
  closingFromState: boolean;
};

export function BottomSheetModalControlled(props: TProps) {
  const { isOpen, onClose, children, options } = props;
  const { showBottomSheet } = useBottomSheet();

  const sheetHandleRef = useRef<TSheetHandle | null>(null);
  const isOpenRef = useRef(isOpen);

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
      const handle = sheetHandleRef.current;

      if (handle) {
        handle.closingFromState = true;
        handle.close();
        sheetHandleRef.current = null;
      }

      return;
    }

    if (sheetHandleRef.current) {
      return;
    }

    // Captured per `showBottomSheet` call so the `onClose` below only ever
    // reacts to the sheet generation it was created for.
    let mountedId: string | undefined;

    showBottomSheet({
      render: ({ closeSheet, id }) => {
        mountedId = id;

        const handle: TSheetHandle = {
          id,
          close: closeSheet,
          closingFromState: false,
        };

        sheetHandleRef.current = handle;

        // The sheet can mount after `isOpen` has already flipped back to
        // false (e.g. a selection closed the picker while the sheet was still
        // presenting). Dismiss it right away so it never lingers open.
        if (!isOpenRef.current) {
          handle.closingFromState = true;

          queueMicrotask(() => {
            // Guard against the handle having moved on to a newer sheet.
            if (sheetHandleRef.current === handle) {
              handle.close();
              sheetHandleRef.current = null;
            }
          });
        }

        return stableInputsRef.current.children;
      },
      options: {
        ...(stableInputsRef.current.options ?? {}),
        onClose: () => {
          // This sheet may no longer be the tracked one — an older
          // generation's `onDismiss` can arrive after a newer sheet was
          // opened. Only touch bookkeeping for the sheet this closure was
          // created for.
          if (mountedId == null || sheetHandleRef.current?.id !== mountedId) {
            return;
          }

          const wasStateDriven = sheetHandleRef.current.closingFromState;

          sheetHandleRef.current = null;

          // only notify parent if sheet initiated the close
          if (!wasStateDriven) {
            stableInputsRef.current.onClose?.();
          }
        },
      },
    });
  }, [isOpen, showBottomSheet]);

  return null;
}
