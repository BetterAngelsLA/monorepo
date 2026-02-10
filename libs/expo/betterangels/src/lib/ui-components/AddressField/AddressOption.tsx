import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { TouchableOpacity } from 'react-native';
import { TPlacePrediction } from '@monorepo/expo/shared/services';

type TAddressOption = {
  item: TPlacePrediction;
  onPress: () => void;
};

export function AddressOption(props: TAddressOption) {
  const { item, onPress } = props;

  return (
    <TouchableOpacity
      style={{
        borderBottomWidth: 1,
        borderBottomColor: Colors.NEUTRAL_LIGHT,
        paddingVertical: Spacings.sm,
      }}
      accessibilityRole="button"
      onPress={onPress}
    >
      <TextRegular>{item.mainText}</TextRegular>
      <TextRegular color={Colors.NEUTRAL_DARK} size="xxs">
        {item.secondaryText}
      </TextRegular>
    </TouchableOpacity>
  );
}
