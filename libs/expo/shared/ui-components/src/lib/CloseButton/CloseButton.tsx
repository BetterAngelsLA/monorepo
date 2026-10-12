import { PlusIcon, TIconSize } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';

interface IProps {
  onClose: () => void;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  iconColor?: Colors;
  iconSize?: TIconSize;
  testId?: string;
}

export function CloseButton(props: IProps) {
  const {
    accessibilityHint,
    onClose,
    style,
    iconColor = Colors.BLACK,
    iconSize = 'md',
    testId,
    children,
  } = props;

  return (
    <Pressable
      onPress={onClose}
      testID={testId}
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
      {children || (
        <PlusIcon size={iconSize} color={iconColor} rotate="45deg" />
      )}
    </Pressable>
  );
}
