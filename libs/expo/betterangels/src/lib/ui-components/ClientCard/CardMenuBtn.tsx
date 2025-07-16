import { ThreeDotIcon } from '@monorepo/expo/shared/icons';
import { IconButton } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, ViewStyle } from 'react-native';

type TCardMenu = {
  onPress: () => void;
  style?: ViewStyle;
};

export function CardMenuBtn(props: TCardMenu) {
  const { onPress, style } = props;

  return (
    <IconButton
      style={[styles.container, style]}
      onPress={onPress}
      variant="transparent"
      accessibilityLabel={'open client options menu'}
      accessibilityHint={'open client options menu'}
    >
      <ThreeDotIcon />
    </IconButton>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    position: 'relative',
  },
});
