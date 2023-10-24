import { colors } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import {
  ImageBackground,
  ImageSourcePropType,
  StatusBar,
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
      <StatusBar barStyle="light-content" />
      <ImageBackground
        resizeMode="cover"
        style={{ backgroundColor: colors.brandDarkBlue, flex: 1 }}
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
