import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BottomSheetModalControlled } from '../BottomSheet';
import { BOTTOM_SHEET_PADDING } from '../BottomSheet/constants';
import { CameraSheet } from '../Camera';
import { MediaPickerMenu } from './MediaPickerMenu';
import { useDocumentPicker } from './useDocumentPicker';
import { useImagePicker } from './useImagePicker';

type PickerMode = 'menu' | 'imageCapture' | 'pickingImage' | 'pickingFile';

type MediaPickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCameraCapture: (file: ReactNativeFile) => void;
  onFilesSelected: (files: ReactNativeFile[]) => void;
  allowMultiple: boolean;
  labels?: {
    image?: string;
    camera?: string;
    file?: string;
  };
};

export function MediaPicker(props: MediaPickerModalProps) {
  const {
    isOpen: mediaPickerActive,
    onClose: onMediaPickerClose,
    onCameraCapture,
    onFilesSelected,
    allowMultiple,
    labels,
  } = props;

  const [currentMode, setCurrentMode] = useState<PickerMode>('menu');
  const currentModeRef = useRef<PickerMode>('menu');

  const { pickImage } = useImagePicker({
    allowMultiple,
  });

  const { pickDocuments } = useDocumentPicker({
    allowMultiple,
  });

  // track currentMode via ref agains racing conditions
  useEffect(() => {
    currentModeRef.current = currentMode;
  }, [currentMode]);

  // Reset to menu when opened
  useEffect(() => {
    if (!mediaPickerActive) {
      return;
    }

    setCurrentMode('menu');
  }, [mediaPickerActive]);

  async function handlePickImage() {
    setCurrentMode('pickingImage');

    const result = await pickImage();

    if (result.type !== 'success') {
      setCurrentMode('menu');

      return;
    }

    // Selection always closes the picker, even if the caller's handler throws.
    try {
      onFilesSelected(result.files);
    } finally {
      onMediaPickerClose();
    }
  }

  async function handlePickDocuments() {
    setCurrentMode('pickingFile');

    const result = await pickDocuments();

    if (result.type !== 'success') {
      setCurrentMode('menu');

      return;
    }

    // Selection always closes the picker, even if the caller's handler throws.
    try {
      onFilesSelected(result.files);
    } finally {
      onMediaPickerClose();
    }
  }

  const handleCameraCapture = useCallback(
    (file: ReactNativeFile) => {
      // Capture always closes the picker, even if the handler throws. The
      // camera is a sheet, so closing it is a plain unmount — the caller is
      // free to navigate immediately.
      try {
        onCameraCapture(file);
      } finally {
        onMediaPickerClose();
      }
    },
    [onCameraCapture, onMediaPickerClose],
  );

  const handleCameraClose = useCallback(() => {
    setCurrentMode('menu');
  }, []);

  const handleMenuSheetClose = useCallback(() => {
    if (currentModeRef.current !== 'menu') {
      return;
    }

    onMediaPickerClose();
  }, [onMediaPickerClose]);

  return (
    <>
      <BottomSheetModalControlled
        isOpen={mediaPickerActive && currentMode === 'menu'}
        onClose={handleMenuSheetClose}
        options={{
          variant: 'bare',
          contentStyle: {
            ...BOTTOM_SHEET_PADDING,
            paddingTop: 0,
          },
          enablePanDownToClose: false,
          // 'replace' is the honest semantic here: the menu and camera are
          // mutually exclusive, so the stack should never hold both. The
          // provider now defers removal of the outgoing sheet until its
          // dismiss completes (`onDismiss` still runs), so the menu slides
          // away under the arriving camera with no stale bookkeeping.
          stackBehavior: 'replace',
        }}
      >
        <MediaPickerMenu
          labels={labels}
          onImageOption={handlePickImage}
          onDocumentsOption={handlePickDocuments}
          onCameraOption={() => setCurrentMode('imageCapture')}
          onCancel={onMediaPickerClose}
        />
      </BottomSheetModalControlled>

      <CameraSheet
        isOpen={mediaPickerActive && currentMode === 'imageCapture'}
        onClose={handleCameraClose}
        onCapture={handleCameraCapture}
      />
    </>
  );
}
