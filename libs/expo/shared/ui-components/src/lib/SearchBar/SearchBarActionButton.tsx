import { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import IconButton from '../IconButton';
import TextButton from '../TextButton';

type TSearchBarActionButtonShared = {
  onPress: () => void;
  disabled?: boolean;
  slotStyle?: StyleProp<ViewStyle>;
};

export type TSearchBarActionButton =
  | ({
      label: string;
      accessibilityHint: string;
      accessibilityLabel?: string;
    } & TSearchBarActionButtonShared)
  | ({
      icon: ReactNode;
      accessibilityHint: string;
      accessibilityLabel: string;
    } & TSearchBarActionButtonShared);

export function SearchBarActionButton(props: TSearchBarActionButton) {
  const { disabled } = props;

  if ('label' in props) {
    const { onPress, label, accessibilityHint, accessibilityLabel } = props;

    return (
      <TextButton
        onPress={onPress}
        disabled={disabled}
        regular
        title={label}
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel ?? label}
      />
    );
  }

  if ('icon' in props) {
    const { onPress, accessibilityHint, accessibilityLabel } = props;

    return (
      <IconButton
        onPress={onPress}
        disabled={disabled}
        variant="transparent"
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel}
      >
        {props.icon}
      </IconButton>
    );
  }

  return null;
}
