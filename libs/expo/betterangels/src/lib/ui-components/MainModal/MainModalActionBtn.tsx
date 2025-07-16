import { Colors } from '@monorepo/expo/shared/static';
import { ElementType } from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { MainModalActionBtnBody } from './MainModalActionBtnBody';

type TProps = {
  title: string;
  Icon: ElementType;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

export function MainModalActionBtn(props: TProps) {
  const { title, Icon, onPress, disabled, style } = props;

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.container, style]}
    >
      {({ pressed }) => (
        <MainModalActionBtnBody
          title={title}
          Icon={Icon}
          style={{
            backgroundColor: pressed
              ? Colors.NEUTRAL_EXTRA_LIGHT
              : Colors.WHITE,
          }}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
});
