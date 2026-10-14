import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { NativePaperProvider } from '@monorepo/expo/betterangels';
import {
  BottomSheetModalProvider,
  GooglePlacesProvider,
} from '@monorepo/expo/shared/ui-components';

import { googlePlacesApiKey } from '../../config';

/**
 * Platform UI providers that do not depend on API config or auth.
 * Rendered outside ``EnvironmentSwitcherProvider`` so they never
 * re-mount when the environment changes.
 */
export function BaUiProviders({ children }: { children: ReactNode }) {
  return (
    <GestureHandlerRootView style={styles.root}>
      <BottomSheetModalProvider>
        <NativePaperProvider>
          <GooglePlacesProvider apiKey={googlePlacesApiKey}>
            {children}
          </GooglePlacesProvider>
        </NativePaperProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
