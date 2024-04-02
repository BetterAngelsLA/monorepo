import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { StyleSheet } from 'react-native';
import { View } from './Themed';

const Separator = () => (
  <View
    style={styles.separator}
    lightColor={Colors.NEUTRAL_LIGHT}
    darkColor="rgba(255,255,255,0.1)"
  />
);

const styles = StyleSheet.create({
  separator: {
    backgroundColor: Colors.NEUTRAL_LIGHT,
    marginVertical: Spacings.lg,
    height: 1,
  },
});

export default Separator;
