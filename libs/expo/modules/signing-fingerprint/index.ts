import { Platform } from 'react-native';

/**
 * Returns the SHA-1 fingerprint of the app's signing certificate
 * as an uppercase hex string (no colons), e.g. "A1B2C3D4E5...".
 *
 * Returns `null` on non-Android platforms (not needed — bundle ID is sufficient).
 */
export function getSigningFingerprint(): string | null {
  if (Platform.OS !== 'android') {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { requireNativeModule } = require('expo-modules-core');
  const mod = requireNativeModule('SigningFingerprint');
  return mod.getFingerprint();
}
