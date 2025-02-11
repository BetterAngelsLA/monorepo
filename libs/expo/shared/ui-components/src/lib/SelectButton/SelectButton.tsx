import { ChevronLeftIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Pressable } from 'react-native';
import { BaseContainer } from '../Container';
import TextRegular from '../TextRegular';

interface ISelectButtonProps {
  defaultLabel?: string;
  selected?: string[];
  onPress: () => void;
}

export function SelectButton(props: ISelectButtonProps) {
  const { defaultLabel = 'All', selected, onPress } = props;

  const isDefault = !selected?.length || selected[0] === defaultLabel;

  let computedLabel: string;

  if (isDefault) {
    computedLabel = defaultLabel;
  } else if (selected.length === 1) {
    computedLabel = selected[0];
  } else {
    computedLabel = `${selected[0]} + (${selected.length - 1})`;
  }

  const backgroundColor = isDefault ? Colors.WHITE : Colors.PRIMARY;
  const textColor = isDefault ? Colors.PRIMARY_EXTRA_DARK : Colors.WHITE;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        borderRadius: Radiuses.xxl,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacings.xxs,
        paddingVertical: Spacings.xs,
        paddingLeft: Spacings.xs,
        backgroundColor: backgroundColor,
      }}
    >
      <TextRegular color={textColor}>{computedLabel}</TextRegular>
      <BaseContainer mx="xs" my="xxs">
        <ChevronLeftIcon color={textColor} size="sm" rotate="-90deg" />
      </BaseContainer>
    </Pressable>
  );
}
