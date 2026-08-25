import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * True when running in the iOS Simulator.
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
export const isIosSimulator = Platform.OS === 'ios' && !Constants.isDevice;
