import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

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
 *     via the `DevMenuPreferences` Expo module.
 *   - Android (any): no-op. expo-dev-menu does not register
 *     `DevMenuPreferences` on Android.
 *   - iOS production / store builds: no-op. expo-dev-menu isn't linked,
 *     so the module is absent from the Expo modules registry.
 *
 * Implementation notes:
 *   - `DevMenuPreferences` is an *Expo Module* (extends `Module` from
 *     `ExpoModulesCore` — see `node_modules/expo-dev-menu/ios/Modules/
 *     DevMenuPreferences.swift`). It is NOT registered on React
 *     Native's legacy `NativeModules` bridge, so `NativeModules.
 *     DevMenuPreferences` is always `undefined`. The correct lookup is
 *     `requireOptionalNativeModule` from `expo-modules-core`, which
 *     reads from the Expo modules registry and returns `null` when the
 *     module isn't linked (production builds) — that's our explicit
 *     no-op gate.
 *   - We do NOT gate on `__DEV__`. Metro inlines `__DEV__` based on the
 *     bundle's build mode, not the host app: EAS Update bundles consumed
 *     by the e2e CI dev client are produced with `dev: false` even
 *     though they run inside a dev client that includes expo-dev-menu
 *     natively. Gating on `__DEV__` would skip this in CI.
 *
 * Call once at app startup, before any UI renders.
 */
export function hideDevMenuFabInDev(): void {
  if (Platform.OS !== 'ios') {
    return;
  }

  // Returns null in production / store builds where expo-dev-menu is
  // not linked.
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
