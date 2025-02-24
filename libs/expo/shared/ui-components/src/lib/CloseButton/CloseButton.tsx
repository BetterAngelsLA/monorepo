import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { Pressable, ViewStyle } from 'react-native';

interface IProps {
  onClose: () => void;
  accessibilityHint?: string;
  style?: ViewStyle;
  children?: ReactNode;
}

export function CloseButton(props: IProps) {
  const { accessibilityHint, onClose, style, children } = props;

  return (
    <Pressable
      onPress={onClose}
      style={[
        {
          minWidth: 40,
          height: 40,
          justifyContent: 'center',
          alignItems: 'center',
          marginLeft: 'auto',
        },
        style,
      ]}
      accessibilityHint={accessibilityHint || 'close'}
      accessibilityRole="button"
    >
      {children || <PlusIcon size="md" color={Colors.BLACK} rotate="45deg" />}
    </Pressable>
  );
}
