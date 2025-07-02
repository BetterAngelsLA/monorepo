import { Spacings } from '@monorepo/expo/shared/static';
import { useEffect, useState } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Input } from '../Input';

interface IPhoneNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  parseNumber?: (value: string) => [string, string | undefined];
  formatValues?: (number: string, extension?: string) => string;
  placeholderNumber?: string;
  placeholderExt?: string;
  disabled?: boolean;
  errors?: {
    phoneNumber?: string;
    extension?: string;
  };
  label?: string;
  style?: ViewStyle;
}

function defaultParseNumber(value: string) {
  return value.split('x');
}

function defaultFormatValues(phoneNumber: string, extension?: string) {
  let formattedPhoneNumber = phoneNumber;
  if (extension) {
    formattedPhoneNumber = `${formattedPhoneNumber}x${extension}`;
  }

  return formattedPhoneNumber;
}

export function PhoneNumberInput(props: IPhoneNumberInputProps) {
  const {
    disabled,
    errors,
    label,
    onChange,
    onClear,
    parseNumber = defaultParseNumber,
    formatValues = defaultFormatValues,
    placeholderExt = 'ext',
    placeholderNumber = 'Enter phone number',
    style,
    value,
  } = props;

  const [phoneNumber, setPhoneNumber] = useState('');
  const [extension, setExtension] = useState('');

  useEffect(() => {
    const [phoneNumber, extension] = parseNumber(value);
    setPhoneNumber(phoneNumber);
    setExtension(extension || '');
  }, [value]);

  useEffect(() => {
    const formattedPhoneNumber = formatValues(phoneNumber, extension);

    if (!formattedPhoneNumber) {
      onClear?.();
    }
  }, [phoneNumber, extension]);

  function makeNumeric(value: string) {
    return value.replace(/[^0-9]/g, '');
  }

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.inputRow]}>
        <Input
          style={styles.number}
          disabled={disabled}
          keyboardType="number-pad"
          label={label}
          onChangeText={(value) => {
            setPhoneNumber(makeNumeric(value));
          }}
          onDelete={() => setPhoneNumber('')}
          placeholder={placeholderNumber}
          value={phoneNumber}
          textContentType="telephoneNumber"
          maxLength={10}
        />
        <Input
          style={styles.extension}
          disabled={disabled}
          keyboardType="number-pad"
          onChangeText={(value) => {
            setExtension(makeNumeric(value));
          }}
          onDelete={() => setExtension('')}
          placeholder={placeholderExt}
          value={extension}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  errors: {},
  number: { flex: 2, marginRight: Spacings.xs },
  extension: { flex: 1 },
});
