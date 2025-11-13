import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Loading from '../Loading';

type TListLoadingIndicatorOpts = {
  size?: 'small' | 'large';
  color?: Colors;
  style?: ViewStyle;
};

export type TLoadingListView = {
  style?: ViewStyle;
  content?: ReactNode;
  indictator?: TListLoadingIndicatorOpts;
};

export function LoadingListView(props: TLoadingListView) {
  const { style, content, indictator } = props;

  const {
    size: indicatorSize = 'large',
    color: indicatorColor = Colors.NEUTRAL_DARK,
    style: indicatorStyle,
  } = indictator || {};

  return (
    <View style={[styles.container, style]}>
      {content}

      {!content && (
        <Loading
          size={indicatorSize}
          style={indicatorStyle}
          color={indicatorColor}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacings.lg,
  },
});
