import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

type DevMenuPreferencesModule = {
  setPreferencesAsync: (prefs: {
    showFloatingActionButton?: boolean;
  }) => Promise<void>;
};

/**
 * Hide the expo-dev-menu floating "Tools" FAB (gear icon) in dev builds
 * so it doesn't overlap in-app UI. Primarily intended for e2e runs on
 * fresh installs, but applied to all dev builds since the FAB is easily
 * re-enabled via the in-app dev menu's "Tools button" toggle when needed.
 *
 * Behavior:
 *   - iOS dev builds: hides the FAB via `DevMenuPreferences` JS module.
 *   - Android dev builds: no-op. expo-dev-menu does not expose
 *     `DevMenuPreferences` to JS on Android; the only way to hide the
 *     FAB there is the in-app Tools toggle (no JS API).
 *   - Production builds: no-op. expo-dev-menu isn't bundled, so
 *     `requireOptionalNativeModule` returns undefined.
 *
 * Call once at app startup, before any UI renders.
 */
export function hideDevMenuFabInDev(): void {
  if (!__DEV__ || Platform.OS !== 'ios') {
    return;
  }

  const DevMenuPreferences =
    requireOptionalNativeModule<DevMenuPreferencesModule>('DevMenuPreferences');

  DevMenuPreferences?.setPreferencesAsync({
    showFloatingActionButton: false,
  });
}
