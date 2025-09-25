import { Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import TextRegular from '../TextRegular';

type TProps = {
  style?: ViewStyle;
  content?: ReactNode;
};

export function LoadingListView(props: TProps) {
  const { style, content } = props;

  return (
    <View style={[styles.container, style]}>
      {content}

      {!content && (
        <TextRegular size="md" textAlign="center">
          Loading…
        </TextRegular>
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
