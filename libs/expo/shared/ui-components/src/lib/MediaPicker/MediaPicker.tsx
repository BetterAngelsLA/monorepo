import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BottomSheetModalControlled } from '../BottomSheet';
import { BOTTOM_SHEET_PADDING } from '../BottomSheet/constants';
import { CameraModal } from '../Camera';
import { MediaPickerMenu } from './MediaPickerMenu';
import { useDocumentPicker } from './useDocumentPicker';
import { useImagePicker } from './useImagePicker';

type PickerMode =
  | 'menu'
  | 'imageCapture'
  /** Camera unmounting; nothing is rendered until the handoff runs. */
  | 'closingCamera'
  | 'pickingImage'
  | 'pickingFile';

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

  /** Held between the capture and the camera finishing its dismissal. */
  const capturedFile = useRef<ReactNativeFile | null>(null);

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

  /**
   * A capture only starts the camera closing — the file is handed up in
   * `handleCameraClosed`, once the native presentation is really gone.
   *
   * The caller's reaction to a capture is usually to navigate away, closing the
   * screen that hosts this picker. Dismissing that screen while the camera's
   * modal is still on its way out leaves an orphaned, invisible view controller
   * over the app that swallows every touch until it finally goes; see the note
   * in CameraModal. Waiting for the handshake keeps the two dismissals in
   * order.
   */
  const handleCameraCapture = useCallback((file: ReactNativeFile) => {
    capturedFile.current = file;

    setCurrentMode('closingCamera');
  }, []);

  const handleCameraClosed = useCallback(() => {
    const file = capturedFile.current;

    if (!file) {
      // Closed without capturing (cancel, or permission denied).
      return;
    }

    capturedFile.current = null;

    // Capture always closes the picker, even if the handler throws.
    try {
      onCameraCapture(file);
    } finally {
      onMediaPickerClose();
      // Fallback for callers that leave the picker open on capture: land back
      // on the menu rather than on an empty 'closingCamera' state.
      setCurrentMode('menu');
    }
  }, [onCameraCapture, onMediaPickerClose]);

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

      {/*
        Mounted for the whole time the picker is open, not just while the
        camera is showing: it has to outlive its own dismissal to report when
        the native presentation is gone.
      */}
      {mediaPickerActive && (
        <CameraModal
          isOpen={currentMode === 'imageCapture'}
          onClose={() => setCurrentMode('menu')}
          onCapture={handleCameraCapture}
          onClosed={handleCameraClosed}
        />
      )}
    </>
  );
}
