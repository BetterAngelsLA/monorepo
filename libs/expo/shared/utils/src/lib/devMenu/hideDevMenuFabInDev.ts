import { NativeModules, Platform } from 'react-native';

type DevMenuPreferencesModule = {
  setPreferencesAsync: (prefs: {
    showFloatingActionButton?: boolean;
  }) => Promise<void>;
};

/**
 * Hide the expo-dev-menu floating "Tools" FAB (gear icon) on iOS dev
 * clients so it doesn't overlap the in-app `nav-menu-btn`.
 *
 * Behavior:
 *   - iOS dev clients (local Metro OR EAS Update bundle): hides the FAB
 *     via `DevMenuPreferences` JS module.
 *   - Android (any): no-op. expo-dev-menu does not expose
 *     `DevMenuPreferences` to JS on Android.
 *   - iOS production / store builds: no-op. expo-dev-menu isn't linked,
 *     so the native module is absent from `NativeModules`.
 *
 * Notes:
 *   - We do NOT gate on `__DEV__`. Metro inlines `__DEV__` based on the
 *     bundle's build mode, not the host app: EAS Update bundles consumed
 *     by the e2e CI dev client are produced with `dev: false` even
 *     though they run inside a dev client that includes expo-dev-menu
 *     natively. Gating on `__DEV__` would skip this in CI.
 *   - We deliberately avoid `requireOptionalNativeModule` from
 *     `expo-modules-core` — its semantics are sparsely documented and
 *     have changed across Expo versions. Reading directly from
 *     `NativeModules` is plain React Native API and the absence check
 *     is explicit.
 *
 * Call once at app startup, before any UI renders.
 */
export function hideDevMenuFabInDev(): void {
  if (Platform.OS !== 'ios') {
    return;
  }

  // Explicit absence check: in production / store builds, expo-dev-menu
  // is not linked and `NativeModules.DevMenuPreferences` is undefined.
  const devMenuPreferences = (NativeModules as Record<string, unknown>)[
    'DevMenuPreferences'
  ] as DevMenuPreferencesModule | undefined;

  if (
    !devMenuPreferences ||
    typeof devMenuPreferences.setPreferencesAsync !== 'function'
  ) {
    return;
  }

  // Fire-and-forget; we don't await on app startup.
  devMenuPreferences.setPreferencesAsync({ showFloatingActionButton: false });
}
