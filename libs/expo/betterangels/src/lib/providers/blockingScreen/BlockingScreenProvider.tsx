import { Colors } from '@monorepo/expo/shared/static';
import { useNavigation } from 'expo-router';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { BlockingScreenContext } from './BlockingScreenContext';

type TBlockingScreenProvider = {
  children: ReactNode;
};

export default function BlockingScreenProvider(props: TBlockingScreenProvider) {
  const { children } = props;

  const navigation = useNavigation();

  const [visible, setVisible] = useState(false);
  const pendingUnsub = useRef<(() => void) | null>(null);

  const blockScreen = () => setVisible(true);
  const unblockScreen = () => setVisible(false);

  const blockScreenUntilNextNavigation = useCallback(() => {
    if (pendingUnsub.current) {
      return;
    }

    blockScreen();

    pendingUnsub.current = navigation.addListener('state', () => {
      unblockScreen();

      pendingUnsub.current?.();
      pendingUnsub.current = null;
    });
  }, [navigation, blockScreen, unblockScreen]);

  useEffect(
    // cleanup on unmount
    () => () => {
      pendingUnsub.current?.();
      pendingUnsub.current = null;
    },
    []
  );

  return (
    <BlockingScreenContext.Provider
      value={{ blockScreen, unblockScreen, blockScreenUntilNextNavigation }}
    >
      {children}
      {visible && (
        <View style={styles.backdrop}>
          <ActivityIndicator size="large" color={Colors.BRAND_DARK_BLUE} />
        </View>
      )}
    </BlockingScreenContext.Provider>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    zIndex: 999,
  },
});
