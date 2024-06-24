import { Colors } from '@monorepo/expo/shared/static';
import { StatusBar } from 'expo-status-bar';
import { ElementType, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AuthContainer({
  children,
  Logo,
}: {
  children: ReactNode;
  Logo?: ElementType;
}) {
  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;
  return (
    <>
      <StatusBar style="dark" />
      <View
        style={[
          styles.container,
          {
            paddingBottom: bottomOffset,
            position: 'relative',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        {Logo && (
          <View style={{ position: 'absolute' }}>
            <Logo width={200} height={30} />
          </View>
        )}
        {children}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: Colors.PRIMARY,
  },
});
