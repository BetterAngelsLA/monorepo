import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';

interface IProps {
  onClose: () => void;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  iconColor?: Colors;
  testId?: string;
}

export function CloseButton(props: IProps) {
  const {
    accessibilityHint,
    onClose,
    style,
    iconColor = Colors.BLACK,
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
      {children || <PlusIcon size="md" color={iconColor} rotate="45deg" />}
    </Pressable>
  );
}
