import { ThreeDotIcon } from '@monorepo/expo/shared/icons';
import { IconButton } from '@monorepo/expo/shared/ui-components';
import { memo } from 'react';
import { StyleSheet } from 'react-native';

type TCardMenu = {
  onPress: () => void;
};

function CardMenuBtnRaw(props: TCardMenu) {
  const { onPress } = props;

  return (
    <IconButton
      style={styles.container}
      onPress={onPress}
      variant="transparent"
      accessibilityLabel={'open client options menu'}
      accessibilityHint={'open client options menu'}
    >
      <ThreeDotIcon />
    </IconButton>
  );
}

export const CardMenuBtn = memo(CardMenuBtnRaw);

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    position: 'relative',
  },
});
