import { Platform } from 'react-native';

/**
 * True when requested via 1 of 2 ENV vars.
 * Targets iOS Simulator, either in local or EAS e2e env.
 *
 * The iOS Simulator has no camera: mounting the real `ExpoCamera` creates an
 * `AVCaptureSession` that can never start (AVFoundation err -12782) and blocks
 * its session queue for ~9s per mount — piling up across open/close cycles and
 * freezing the flow. We render a black placeholder instead of a live preview
 * and generate a placeholder photo on capture.
 *
 * The Android emulator is deliberately excluded — it provides a virtual camera
 * feed, so the real camera keeps working there.
 */

const isEasE2eMode = process.env.EXPO_PUBLIC_E2E_MODE === '1'; // set in eas-e2e.ts
const mockCameraRequestedLocally =
  process.env.EXPO_PUBLIC_MOCK_EXPO_CAMERA_LOCALLY === 'true';

export const shouldMockCamera =
  Platform.OS === 'ios' && (isEasE2eMode || mockCameraRequestedLocally);
