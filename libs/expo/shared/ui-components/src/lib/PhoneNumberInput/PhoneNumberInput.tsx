import { Spacings } from '@monorepo/expo/shared/static';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Input } from '../Input';

interface IPhoneNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholderNumber?: string;
  placeholderExt?: string;
  disabled?: boolean;
  errors?: {
    phoneNumber?: string;
    extension?: string;
  };
}

function parsePhoneNumber(value: string) {
  return value.split('x');
}

export function PhoneNumberInput(props: IPhoneNumberInputProps) {
  const {
    value,
    onChange,
    onClear,
    errors,
    placeholderNumber = 'Enter phone number',
    placeholderExt = 'ext',
    disabled,
  } = props;

  const [phoneNumber, setPhoneNumber] = useState('');
  const [extension, setExtension] = useState('');

  useEffect(() => {
    const [phoneNumber, extension] = parsePhoneNumber(value);
    setPhoneNumber(phoneNumber);
    setExtension(extension || '');
  }, [value]);

  useEffect(() => {
    let formattedPhoneNumber = phoneNumber;
    if (extension) {
      formattedPhoneNumber = `${formattedPhoneNumber}x${extension}`;
    }
    onChange(formattedPhoneNumber);

    if (!formattedPhoneNumber) {
      onClear?.();
    }
  }, [phoneNumber, extension]);

  return (
    <View style={{ flexDirection: 'row' }}>
      <Input
        disabled={disabled}
        error={!!errors?.phoneNumber}
        keyboardType="number-pad"
        label={'Phone Number'}
        onChangeText={(value) => setPhoneNumber(value)}
        onDelete={() => setPhoneNumber('')}
        placeholder={placeholderNumber}
        style={{ flex: 2, marginRight: Spacings.xs }}
        value={phoneNumber}
      />
      <Input
        disabled={disabled}
        error={!!errors?.extension}
        keyboardType="number-pad"
        label={'ext'}
        onChangeText={(value) => setExtension(value)}
        onDelete={() => setExtension('')}
        placeholder={placeholderExt}
        style={{ flex: 1 }}
        value={extension}
      />
    </View>
  );
}
