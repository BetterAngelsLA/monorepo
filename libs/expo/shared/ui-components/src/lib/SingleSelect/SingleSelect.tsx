import { Colors, Spacings, TSpacing } from '@monorepo/expo/shared/static';
import { View } from 'react-native';
import Picker from '../Picker_V2';
import Radio from '../Radio_V2';
import TextRegular from '../TextRegular';

interface ISingleSelectProps {
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  label?: string;
  placeholder?: string;
  onChange: (value: string | null) => void;
  items: { displayValue?: string; value: string }[];
  required?: boolean;
  disabled?: boolean;
  selectedValue?: string;
  selectNoneLabel?: string;
  allowSelectNone?: boolean;
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
    required,
    disabled,
    placeholder = '',
    selectedValue,
    selectNoneLabel,
    allowSelectNone,
    error,
    maxRadioItems = 3,
  } = props;

  const asSelect = items.length > maxRadioItems;

  const selectedItem = items.find((item) => item.value === selectedValue);

  if (asSelect) {
    return (
      <Picker
        error={error}
        label={label}
        required={required}
        selectedValue={selectedItem?.value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        selectNoneLabel={selectNoneLabel}
        allowSelectNone={allowSelectNone}
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
          disabled={disabled}
          onPress={onChange}
          selectedValue={selectedItem?.value}
          displayValue={displayValue}
          value={value}
        />
      ))}
      {error && (
        <TextRegular size="sm" color={Colors.ERROR}>
          {error}
        </TextRegular>
      )}
    </View>
  );
}
