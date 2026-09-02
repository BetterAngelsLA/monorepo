/**
 * MenuSheetActionBtn
 *
 * A single full-width action row for `MenuSheet` (or any menu surface).
 * Visually mirrors `MainModalActionBtn` so MainModal callers can migrate to
 * MenuSheet without changing the look of their rows.
 */
import {
  Colors,
  FontSizes,
  Radiuses,
  Spacings,
} from '@monorepo/expo/shared/static';
import { ElementType, ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import TextOrNode from '../TextOrNode';

export type TMenuSheetAction = {
  title: string | ReactNode;
  Icon: ElementType;
  testId?: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

export function MenuSheetActionBtn(props: TMenuSheetAction) {
  const { title, Icon, testId, onPress, disabled, style } = props;

  return (
    <Pressable
      disabled={disabled}
      testID={testId}
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.container, style]}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.body,
            {
              backgroundColor: pressed
                ? Colors.NEUTRAL_EXTRA_LIGHT
                : Colors.WHITE,
            },
          ]}
        >
          <View style={styles.iconWrapper}>
            <Icon color={Colors.PRIMARY_EXTRA_DARK} />
          </View>

          <TextOrNode
            textStyle={{ color: Colors.PRIMARY_EXTRA_DARK, ...FontSizes.md }}
          >
            {title}
          </TextOrNode>
        </View>
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
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: Radiuses.xs,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.sm,
  },
  iconWrapper: {
    marginRight: Spacings.sm,
    height: Spacings.xl,
    width: Spacings.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
