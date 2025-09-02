import { Colors } from '@monorepo/expo/shared/static';
import { Loading } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View, ViewStyle } from 'react-native';

type TProps = {
  style?: ViewStyle;
  indicatorSize?: 'small' | 'large';
  indicatorColor?: Colors;
  indicatorStyle?: ViewStyle;
  fullScreen?: boolean;
};

export function ListLoadingView(props: TProps) {
  const {
    style,
    indicatorSize = 'large',
    indicatorColor = Colors.NEUTRAL_DARK,
    indicatorStyle,
    fullScreen,
  } = props;

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen, style]}>
      <Loading
        size={indicatorSize}
        style={indicatorStyle}
        color={indicatorColor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    alignItems: 'center',
  },
  fullScreen: {
    flex: 1,
    marginTop: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
