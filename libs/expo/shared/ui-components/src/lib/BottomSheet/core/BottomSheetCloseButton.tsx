import { TIconSize } from '@monorepo/expo/shared/icons';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import CloseButton from '../../CloseButton';

type TProps = {
  onClose: () => void;
  style?: StyleProp<ViewStyle>;
  iconSize?: TIconSize;
  accessibilityHint?: string;
};

export function BottomSheetCloseButton(props: TProps) {
  const {
    onClose,
    accessibilityHint = 'closes the sheet',
    iconSize = 'md',
    style,
  } = props;

  return (
    <CloseButton
      style={[styles.container, style]}
      accessibilityHint={accessibilityHint}
      iconSize={iconSize}
      onClose={onClose}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 0,
    paddingRight: 24,
    paddingLeft: 12,
  },
});
