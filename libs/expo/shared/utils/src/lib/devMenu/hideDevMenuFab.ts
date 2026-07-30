import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

type DevMenuPreferencesModule = {
  setPreferencesAsync: (prefs: {
    showFloatingActionButton?: boolean;
  }) => Promise<void>;
};

/**
 * Hide the expo-dev-menu floating "Tools" FAB on iOS so it doesn't overlap
 * the in-app `nav-menu-btn` during development and e2e.
 *
 * The `expo` import is lazy (dynamic require) to avoid pulling React Native
 * globals (ErrorUtils) into test environments via barrel exports. The function
 * is a no-op outside of dev/e2e, so the lazy load has no runtime cost in prod.
 */
export function hideDevMenuFab(): void {
  const enabled = __DEV__ || process.env['EXPO_PUBLIC_E2E_MODE'] === '1';

  if (!enabled) {
    return;
  }

  if (Platform.OS !== 'ios') {
    return;
  }

  // Returns null in builds where expo-dev-menu is not linked.
  const devMenuPreferences =
    requireOptionalNativeModule<DevMenuPreferencesModule>('DevMenuPreferences');

  if (
    !devMenuPreferences ||
    typeof devMenuPreferences.setPreferencesAsync !== 'function'
  ) {
    return;
  }

  // Fire-and-forget; we don't await on app startup.
  devMenuPreferences.setPreferencesAsync({ showFloatingActionButton: false });
}
