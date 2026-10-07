import { LocationArrowIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import IconButton from '../IconButton';

interface ILocateMeButtonProps {
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function LocateMeButton(props: ILocateMeButtonProps) {
  const {
    onPress,
    disabled,
    style,
    accessibilityLabel = 'userlocation button',
    accessibilityHint = 'gets user location',
  } = props;
  return (
    <IconButton
      style={[styles.button, style]}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      variant="secondary"
    >
      <LocationArrowIcon color={Colors.PRIMARY} />
    </IconButton>
  );
}

const styles = StyleSheet.create({
  button: {
    elevation: 5,
    shadowColor: Colors.NEUTRAL_DARK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
