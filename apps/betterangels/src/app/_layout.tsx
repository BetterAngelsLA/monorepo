import 'expo-dev-client';
import { FontLoader } from '@monorepo/expo/shared/ui-components';

import { type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';

import { EnvironmentSwitcherProvider } from '@monorepo/ba-platform';
import {
  AppUpdatePrompt,
  ErrorCrashView,
  useNewRelic,
} from '@monorepo/expo/betterangels';
import { asyncStorageAdapter } from '@monorepo/expo/shared/utils';

import { apiUrl, demoApiUrl, localApiUrl } from '../../config';
import { buildApiEnvironments } from '../apiEnvironments';
import { buildFetchClient } from '../init';
import { BaDataProviders } from '../providers/BaDataProviders';
import { BaUiProviders } from '../providers/BaUiProviders';
import AppRoutesStack from './AppRoutesStack';

// ---------------------------------------------------------------------------
// Static config
// ---------------------------------------------------------------------------

// Ensure that reloading on `/modal` keeps a back button present.
export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Render Error page on uncaught error
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorCrashView {...props} />;
}

// The URLs below are the direct API URLs on native and in a deployed web build.
// A web *dev* build gets the same-origin dev proxy instead, so the browser is not
// crossing an origin (see `buildApiEnvironments`, and dev-api-proxy.js for the
// server half). Module-level because the provider treats it as static config.
const ENVIRONMENTS = buildApiEnvironments({
  platform: Platform.OS,
  isDev: __DEV__,
  // Keyed on `Platform.OS`, not `typeof window`: React Native defines a global
  // `window` without a `location`, so a `typeof window` guard dereferences
  // `window.location.origin` on native and throws while this module is evaluated.
  webOrigin: Platform.OS === 'web' ? window.location.origin : undefined,
  apiUrl,
  demoApiUrl,
  localApiUrl,
});

// ---------------------------------------------------------------------------
// Root layout
// ---------------------------------------------------------------------------

export default function RootLayout() {
  useNewRelic();

  return (
    <FontLoader>
      <BaUiProviders>
        <EnvironmentSwitcherProvider
          environments={ENVIRONMENTS}
          storage={asyncStorageAdapter}
          buildFetch={buildFetchClient}
        >
          <BaDataProviders>
            <AppUpdatePrompt />
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
            <AppRoutesStack />
          </BaDataProviders>
        </EnvironmentSwitcherProvider>
      </BaUiProviders>
    </FontLoader>
  );
}
