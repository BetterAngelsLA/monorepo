import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { TouchableOpacity } from 'react-native';

type TAutocompletePrediction = google.maps.places.AutocompletePrediction;

type TAddressOption = {
  item: TAutocompletePrediction;
  onPress: () => void;
};

export function AddressOption(props: TAddressOption) {
  const { item, onPress } = props;

  const addressArr = item.description.split(', ');
  const streetAddress = addressArr[0];
  const cityState = `${addressArr[1]}, ${addressArr[2]}`;

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
      <TextRegular>{streetAddress}</TextRegular>
      <TextRegular color={Colors.NEUTRAL_DARK} size="xxs">
        {cityState}
      </TextRegular>
    </TouchableOpacity>
  );
}
