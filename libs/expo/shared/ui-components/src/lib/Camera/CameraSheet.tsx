import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { Colors } from '@monorepo/expo/shared/static';
import { useCameraPermissions } from 'expo-camera';
import { useEffect } from 'react';
import { Alert, BackHandler } from 'react-native';
import { BottomSheetModalControlled } from '../BottomSheet';
import { BottomSheetOptions } from '../BottomSheet/types';
import { CameraView } from './CameraView';

// const HEADER_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : 56;

type Props = {
  /** Drives the presentation. */
  isOpen: boolean;

  /** Called when the user cancels or permission is denied. */
  onClose: () => void;

  /** Called when a photo is successfully captured. */
  onCapture: (file: ReactNativeFile) => void;
};

/**
 * CameraSheet
 *
 * A full-screen camera, presented through the bottom-sheet system rather than
 * a React Native `Modal`.
 *
 * That choice is deliberate and load-bearing. An RN `Modal` is its own native
 * view controller, so closing one is a native transition — and if the screen
 * hosting the camera navigates away at the same moment (which is exactly what
 * happens when a capture kicks off an upload and closes the upload screen),
 * iOS is asked to run two dismissals on one presentation chain. The result is
 * a half-finished teardown: an empty, transparent view controller left sitting
 * over the app, invisible and absent from the accessibility tree, swallowing
 * every touch until it eventually clears. The screen underneath looks and
 * reads as normal while nothing on it responds.
 *
 * Sheets have no such failure mode. They are portalled React content in the
 * same tree, so closing one is an ordinary unmount with nothing to interleave
 * with navigation, and the caller needs no dismissal handshake before it
 * navigates.
 */
export function CameraSheet({ isOpen, onClose, onCapture }: Props) {
  const [permission, requestPermission] = useCameraPermissions();

  // Only ask once the camera is actually wanted: requesting on mount would pop
  // the system prompt as soon as the media picker opened.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;

    async function ensurePermission() {
      const result = await requestPermission();

      if (cancelled || result.granted) {
        return;
      }

      Alert.alert(
        'Permission Denied',
        'You need to grant camera permission to use this feature.',
      );

      onClose();
    }

    ensurePermission();

    return () => {
      cancelled = true;
    };
  }, [isOpen, requestPermission, onClose]);

  // Sheets get no hardware-back handling from gorhom, and an unhandled back
  // press reaches the navigator — which would pop the screen *behind* the
  // camera rather than closing the camera. `Modal` covered this via
  // `onRequestClose`; a sheet has to do it itself.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onClose();

        return true;
      },
    );

    return () => subscription.remove();
  }, [isOpen, onClose]);

  return (
    <BottomSheetModalControlled
      isOpen={isOpen && !!permission?.granted}
      onClose={onClose}
      options={CAMERA_SHEET_OPTIONS}
    >
      <CameraView onCapture={onCapture} onCancel={onClose} />
    </BottomSheetModalControlled>
  );
}

const CAMERA_SHEET_OPTIONS: BottomSheetOptions = {
  // 'bare' already drops the radius, background and padding a normal sheet
  // brings; the rest turns a sheet into a plain full-screen surface.
  variant: 'bare',

  // Height comes from the snap point, resolved against the active container by
  // BottomSheetLayoutProvider — so this is the hosting screen's full height,
  // including inside a modal screen.
  snapPoints: ['100%'],

  // Required with a fixed snap point: dynamic sizing (on by default) adds a
  // content-height snap point alongside '100%', and a camera preview has no
  // intrinsic height, so the sheet would open collapsed.
  enableDynamicSizing: false,

  // A stray downward drag must not throw away the camera; Cancel and hardware
  // back are the ways out.
  enablePanDownToClose: false,

  // Gorhom pads the content container by
  // `sqrt(containerHeight) * overDragResistanceFactor` (~73pt here) to hide the
  // gap that would appear under an over-dragged sheet. A sheet already at
  // '100%' has nowhere higher to go, so that padding is pure overflow past the
  // bottom of the screen — and it skews anything sized as a percentage of the
  // container, which is how the camera is sized. Zero makes the sheet exactly
  // its snap point.
  overDragResistanceFactor: 0,

  // Nothing to reveal behind a full-screen surface.
  disableBackdrop: true,
  showHandle: false,

  // The menu and camera are mutually exclusive, so the stack should never hold
  // both. The provider defers removal of the outgoing sheet until its dismiss
  // completes, so the menu still slides away under the arriving camera — and
  // the camera is appended last, which is what puts it above the outgoing sheet.
  stackBehavior: 'replace',

  sheetStyle: {
    backgroundColor: Colors.BLACK,
  },
  // `height` rather than `flex: 1`: gorhom styles its content view
  // `position: absolute` (after any style passed to it), and an absolutely
  // positioned box does not participate in flex — so `flex: 1` is inert and the
  // camera collapses to nothing. Its parent does have a definite height, so a
  // percentage fills the sheet.
  contentStyle: {
    height: '100%',
  },
};
