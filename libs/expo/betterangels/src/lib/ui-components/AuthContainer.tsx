import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { StatusBar } from 'expo-status-bar';
import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type AuthContainerProps = {
  children: ReactNode;
  header?: ReactNode; // Changed from Logo component to generic ReactNode
  style?: ViewStyle;
};

export default function AuthContainer({
  children,
  header,
  style,
}: AuthContainerProps) {
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar style="dark" />
      <View style={[styles.container, { paddingBottom: insets.bottom }, style]}>
        <View style={styles.headerContainer}>{header}</View>
        <View style={styles.contentContainer}>{children}</View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: Spacings.sm,
    width: '100%',
  },
  headerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  contentContainer: {
    width: '100%',
    paddingBottom: 20,
  },
});
