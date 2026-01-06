import { Colors, Radiuses } from '@monorepo/expo/shared/static';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type TProps = {
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
  disabled?: boolean;
};

export function TaskCountIndictorDot(props: TProps) {
  const { loading, style } = props;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: loading ? Colors.NEUTRAL_LIGHT : Colors.ERROR },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    width: 10,
    height: 10,
    marginLeft: 5,
    borderRadius: Radiuses.lg,
  },
});
