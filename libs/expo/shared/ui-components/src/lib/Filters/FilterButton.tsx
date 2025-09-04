import { ChevronLeftIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { BaseContainer } from '../Container';
import TextRegular from '../TextRegular';

export type TFilterButton = {
  label: string;
  selected: string[];
  onPress: (id?: string) => void;
  labelMaxWidth?: number;
  style?: StyleProp<ViewStyle>;
};

export function FilterButton(props: TFilterButton) {
  const { label, selected, onPress, labelMaxWidth, style } = props;

  const visibleLabel = selected[0] || label;
  let backgroundColor = Colors.WHITE;
  let textColor = Colors.PRIMARY_EXTRA_DARK;
  let extraSelected = 0;

  if (selected.length) {
    textColor = Colors.WHITE;
    backgroundColor = Colors.PRIMARY;
    extraSelected = selected.length - 1;
  }

  return (
    <Pressable
      onPress={() => onPress()}
      accessibilityRole="button"
      style={[styles.container, { backgroundColor: backgroundColor }, style]}
    >
      <View style={{ maxWidth: labelMaxWidth }}>
        <TextRegular color={textColor} numberOfLines={1} ellipsizeMode="tail">
          {visibleLabel}
        </TextRegular>
      </View>
      {!!extraSelected && (
        <TextRegular color={textColor} numberOfLines={1} ellipsizeMode="tail">
          + ({extraSelected})
        </TextRegular>
      )}
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
