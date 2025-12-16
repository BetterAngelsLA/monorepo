import { Colors, Spacings } from '@monorepo/expo/shared/static';
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
      <StatusBar style="light" />
      <View
        style={[
          styles.container,
          {
            paddingBottom: bottomOffset,
            justifyContent: 'flex-end',
            alignItems: 'center',
          },
        ]}
      >
        {Logo && (
          <View style={{ marginBottom: 0 }}>
            <Logo width={216} height={33} />
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
    paddingHorizontal: Spacings.sm,
    backgroundColor: Colors.PRIMARY,
    width: '100%',
  },
});
