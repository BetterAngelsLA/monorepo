import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BottomSheetModalControlled } from '../BottomSheet';
import { BOTTOM_SHEET_PADDING } from '../BottomSheet/constants';
import { CameraModal } from '../Camera';
import { MediaPickerMenu } from './MediaPickerMenu';
import { useDocumentPicker } from './useDocumentPicker';
import { useImagePicker } from './useImagePicker';

type PickerMode = 'menu' | 'imageCapture' | 'pickingImage' | 'pickingFile';

type MediaPickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCameraCapture: (file: ReactNativeFile) => void;
  onFilesSelected: (files: ReactNativeFile[]) => void;
  onSelectionComplete?: () => void;
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
    onSelectionComplete,
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

    onFilesSelected(result.files);
    onSelectionComplete?.();
  }

  async function handlePickDocuments() {
    setCurrentMode('pickingFile');

    const result = await pickDocuments();

    if (result.type !== 'success') {
      setCurrentMode('menu');

      return;
    }

    onFilesSelected(result.files);
    onSelectionComplete?.();
  }

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

      {mediaPickerActive && currentMode === 'imageCapture' && (
        <CameraModal
          onClose={() => setCurrentMode('menu')}
          onCapture={(file) => {
            onCameraCapture(file);
            onSelectionComplete?.();
          }}
        />
      )}
    </>
  );
}
