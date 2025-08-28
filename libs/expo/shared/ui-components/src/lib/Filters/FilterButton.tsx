import { ChevronLeftIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { BaseContainer } from '../Container';
import TextRegular from '../TextRegular';

export type TFilterButton = {
  id: string;
  selected: string[];
  onPress: (id: string) => void;
  style?: StyleProp<ViewStyle>;
};

export function FilterButton(props: TFilterButton) {
  const { id, selected, onPress, style } = props;

  let computedLabel = id;
  let backgroundColor = Colors.WHITE;
  let textColor = Colors.PRIMARY_EXTRA_DARK;

  if (selected.length) {
    textColor = Colors.WHITE;
    backgroundColor = Colors.PRIMARY;

    computedLabel =
      selected.length === 1
        ? selected[0]
        : `${selected[0]} + (${selected.length - 1})`;
  }

  return (
    <Pressable
      onPress={() => onPress(id)}
      accessibilityRole="button"
      style={[styles.container, { backgroundColor: backgroundColor }, style]}
    >
      <TextRegular color={textColor}>{computedLabel}</TextRegular>
      <BaseContainer mx="xs" my="xxs">
        <ChevronLeftIcon color={textColor} size="sm" rotate="-90deg" />
      </BaseContainer>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radiuses.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xxs,
    paddingVertical: Spacings.xs,
    paddingLeft: Spacings.xs,
  },
});
