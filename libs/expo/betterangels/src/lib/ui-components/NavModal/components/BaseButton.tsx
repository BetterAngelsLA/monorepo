import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

type SlotProps = {
  children?: ReactNode;
  style?: ViewStyle;
};

function Slot(props: SlotProps) {
  const { style, children } = props;

  return <View style={[styles.slot, style]}>{children}</View>;
}

type BaseButtonProps = {
  onPress: () => void;
  children: ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
};

function BaseButton(props: BaseButtonProps) {
  const { onPress, children, style, contentStyle } = props;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.container, style]}
    >
      {({ pressed }) => (
        <View
          style={[
            {
              backgroundColor: pressed
                ? Colors.NEUTRAL_EXTRA_LIGHT
                : Colors.WHITE,
            },
            styles.content,
            contentStyle,
          ]}
        >
          {children}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radiuses.xs,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.sm,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  slot: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
    marginRight: Spacings.sm,
  },
});

BaseButton.Slot = Slot;

export { BaseButton };
