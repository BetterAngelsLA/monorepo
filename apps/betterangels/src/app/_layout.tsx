import 'expo-dev-client';

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

import { apiUrl, demoApiUrl } from '../../config';
import { buildFetchClient } from '../init';
import AppRoutesStack from './AppRoutesStack';
import { BaDataProviders } from './BaDataProviders';
import { BaUiProviders } from './BaUiProviders';

// ---------------------------------------------------------------------------
// Static config
// ---------------------------------------------------------------------------

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorCrashView {...props} />;
}

const ENVIRONMENTS = [
  { name: 'production' as const, url: apiUrl },
  { name: 'demo' as const, url: demoApiUrl },
];

// ---------------------------------------------------------------------------
// Root layout
// ---------------------------------------------------------------------------

export default function RootLayout() {
  useNewRelic();

  return (
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
  );
}
