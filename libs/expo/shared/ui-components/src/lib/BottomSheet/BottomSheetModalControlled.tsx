import { ReactNode, useEffect, useRef } from 'react';
import { useBottomSheet } from './provider/useBottomSheet';
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
          stableInputsRef.current.onClose?.();
        },
      },
    });
  }, [isOpen, showBottomSheet]);

  return null;
}
