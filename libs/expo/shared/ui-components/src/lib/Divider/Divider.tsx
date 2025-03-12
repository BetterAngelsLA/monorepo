import { Colors } from '@monorepo/expo/shared/static';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type DividerProps = {
  style?: StyleProp<ViewStyle>;
};

export function Divider({ style }: DividerProps) {
  return <View style={[styles.divider, style]} />;
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: Colors.NEUTRAL_LIGHT,
  },
});
