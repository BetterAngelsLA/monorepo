import { Colors } from '@monorepo/expo/shared/static';
import { StatusBar } from 'expo-status-bar';
import { ReactNode } from 'react';
import {
  ImageBackground,
  ImageSourcePropType,
  StyleSheet,
  View,
} from 'react-native';

export default function AuthContainer({
  imageSource,
  children,
}: {
  imageSource: ImageSourcePropType;
  children: ReactNode;
}) {
  return (
    <>
      <StatusBar style="dark" />
      <ImageBackground
        resizeMode="cover"
        style={{ backgroundColor: Colors.BRAND_DARK_BLUE, flex: 1 }}
        source={imageSource}
      >
        <View style={styles.container}>{children}</View>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
