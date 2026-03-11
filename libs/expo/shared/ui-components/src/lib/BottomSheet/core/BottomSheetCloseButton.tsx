import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import CloseButton from '../../CloseButton';

type TProps = {
  onClose: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

export function BottomSheetCloseButton(props: TProps) {
  const { onClose, accessibilityHint = 'closes the sheet', style } = props;

  return (
    <CloseButton
      style={[styles.container, style]}
      accessibilityHint={accessibilityHint}
      onClose={onClose}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 0,
  },
});
