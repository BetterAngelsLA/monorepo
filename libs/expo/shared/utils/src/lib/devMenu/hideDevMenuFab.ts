import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

type DevMenuPreferencesModule = {
  setPreferencesAsync: (prefs: {
    showFloatingActionButton?: boolean;
  }) => Promise<void>;
};

/**
 * Hide the expo-dev-menu floating "Tools" FAB (gear icon) on iOS so it
 * doesn't overlap the in-app `nav-menu-btn` during development and e2e.
 *
 * Gating (defense in depth — both must be false to reach native code):
 *   - `__DEV__`: true for local Metro dev bundles, false for production
 *     and EAS Update bundles (Metro inlines based on the bundle's
 *     `dev` flag, not the host app).
 *   - `EXPO_PUBLIC_E2E_MODE === '1'`: set by `tools/scripts/eas-e2e.ts`
 *     before invoking `eas update`, so the published e2e bundle has it
 *     statically inlined by Metro. Covers the CI case where the dev
 *     client runs an EAS Update bundle (so `__DEV__` is false even
 *     though expo-dev-menu IS linked natively).
 *
 * Behavior:
 *   - iOS, local dev OR e2e CI: hides the FAB via `DevMenuPreferences`
 *     Expo module.
 *   - iOS production / store builds: no-op (gates fail; module also
 *     not linked, so even without the gate `requireOptionalNativeModule`
 *     would return null).
 *   - Android (any): no-op. expo-dev-menu does not register
 *     `DevMenuPreferences` on Android.
 *
 * Implementation notes:
 *   - `DevMenuPreferences` is an *Expo Module* (extends `Module` from
 *     `ExpoModulesCore` — see `node_modules/expo-dev-menu/ios/Modules/
 *     DevMenuPreferences.swift`), NOT a legacy RN bridge module. So
 *     `NativeModules.DevMenuPreferences` is always `undefined`; use
 *     `requireOptionalNativeModule` from `expo-modules-core` instead.
 *
 * Call once at app startup, before any UI renders.
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
