import { Colors } from '@monorepo/expo/shared/static';
import { Loading } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View, ViewStyle } from 'react-native';

type TProps = {
  style?: ViewStyle;
};

export function ListLoadingView(props: TProps) {
  const { style } = props;

  return (
    <View style={[styles.container, style]}>
      <Loading size="large" color={Colors.NEUTRAL_DARK} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    alignItems: 'center',
  },
});
