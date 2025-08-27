// CTAButton.tsx
import { ChevronLeftIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  GestureResponderEvent,
  Pressable,
  PressableProps,
  StyleSheet,
  View,
} from 'react-native';
import TextBold from '../TextBold';

export type CTAButtonProps = PressableProps & {
  label: string;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
};

export function CTAButton({
  label,
  onPress,
  disabled = false,
  accessibilityHint,
  style,
  ...pressableProps
}: CTAButtonProps) {
  const isDisabled = disabled;

  return (
    <Pressable
      {...pressableProps}
      onPress={isDisabled ? undefined : onPress}
      style={{
        backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
        borderRadius: Radiuses.xs,
        opacity: isDisabled ? 0.5 : 1,
      }}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
    >
      <View style={styles.content}>
        <TextBold
          style={{ flex: 1 }}
          numberOfLines={1}
          size="sm"
          color={Colors.PRIMARY}
        >
          {label}
        </TextBold>
        <ChevronLeftIcon size="sm" rotate={'180deg'} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacings.xs,
    paddingHorizontal: Spacings.sm,
    gap: Spacings.sm,
  },

  disabled: {
    opacity: 0.5,
  },
});
