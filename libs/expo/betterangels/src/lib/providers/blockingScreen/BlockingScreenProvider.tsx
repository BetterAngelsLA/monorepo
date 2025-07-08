import { Colors } from '@monorepo/expo/shared/static';
import { ReactNode, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { BlockingScreenContext } from './BlockingScreenContext';

type TBlockingScreenProvider = {
  children: ReactNode;
};

export default function BlockingScreenProvider(props: TBlockingScreenProvider) {
  const { children } = props;

  const [visible, setVisible] = useState(false);

  const blockScreen = () => setVisible(true);
  const unblockScreen = () => setVisible(false);

  return (
    <BlockingScreenContext.Provider value={{ blockScreen, unblockScreen }}>
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
