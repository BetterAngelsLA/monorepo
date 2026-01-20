import {
  Colors,
  Spacings,
  TMarginProps,
  getMarginStyles,
} from '@monorepo/expo/shared/static';
import { View } from 'react-native';
import FormFieldLabel from '../FormFieldLabel';
import Picker from '../Picker';
import Radio from '../Radio';
import TextRegular from '../TextRegular';

interface ISingleSelectProps extends TMarginProps {
  label?: string;
  placeholder?: string;
  onChange: (value: string | null) => void;
  items: { displayValue?: string; value: string }[];
  required?: boolean;
  disabled?: boolean;
  selectedValue?: string | null;
  selectNoneLabel?: string;
  allowSelectNone?: boolean;
  error?: string;
  maxRadioItems?: number;
}

export function SingleSelect(props: ISingleSelectProps) {
  const {
    items,
    label,
    onChange,
    required,
    disabled,
    placeholder = '',
    selectedValue,
    error,
    maxRadioItems = 3,
    ...rest
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
        items={items}
        {...rest}
      />
    );
  }

  return (
    <View
      style={{
        ...getMarginStyles(props),
        gap: Spacings.xs,
      }}
    >
      {label && <FormFieldLabel label={label} required={required} />}

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
