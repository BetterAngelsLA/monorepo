import { colors } from '@monorepo/expo/shared/static';
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
    <ImageBackground
      resizeMode="cover"
      style={{ backgroundColor: colors.background, flex: 1 }}
      source={imageSource}
    >
      <View style={styles.container}>{children}</View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
