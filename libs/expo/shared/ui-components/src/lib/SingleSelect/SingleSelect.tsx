import { Spacings, TSpacing } from '@monorepo/expo/shared/static';
import { View } from 'react-native';
import Picker from '../Picker_V2';
import Radio from '../Radio_V2';

interface ISingleSelectProps {
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  label?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  items: { displayValue: string; value: string }[];
  selectedValue?: string;
  labelMarginLeft?: TSpacing;
  boldLabel?: boolean;
  error?: string;
  maxRadioItems?: number;
}

export function SingleSelect(props: ISingleSelectProps) {
  const {
    items,
    mb,
    mt,
    mr,
    ml,
    my,
    mx,
    label,
    onChange,
    placeholder = '',
    selectedValue,
    error,
    maxRadioItems = 3,
  } = props;

  const asSelect = items.length > maxRadioItems;

  const selectedItem = items.find(
    (item) => item.displayValue === selectedValue
  );

  if (asSelect) {
    return (
      <Picker
        error={error}
        label={label}
        value={selectedItem?.value}
        displayValue={selectedItem?.displayValue}
        onChange={onChange}
        placeholder={placeholder}
        items={items}
        mb={mb}
        mt={mt}
        mr={mr}
        ml={ml}
        my={my}
        mx={mx}
      />
    );
  }

  return (
    <View
      style={{
        marginBottom: mb && Spacings[mb],
        marginTop: mt && Spacings[mt],
        marginLeft: ml && Spacings[ml],
        marginRight: mr && Spacings[mr],
        marginHorizontal: mx && Spacings[mx],
        marginVertical: my && Spacings[my],
        gap: Spacings.xs,
      }}
    >
      {items.map(({ displayValue, value }) => (
        <Radio
          key={value || displayValue}
          error={error}
          onPress={onChange}
          displayValue={displayValue}
          selectedItem={selectedItem?.value}
          value={value}
        />
      ))}
    </View>
  );
}
