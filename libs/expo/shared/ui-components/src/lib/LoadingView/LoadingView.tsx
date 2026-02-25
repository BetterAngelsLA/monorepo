import { Colors } from '@monorepo/expo/shared/static';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Loading from '../Loading';

type TProps = {
  style?: ViewStyle;
};

export function LoadingView(props: TProps) {
  const { style } = props;

  return (
    <View style={[styles.container, style]}>
      <Loading size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
