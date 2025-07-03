import { Spacings } from '@monorepo/expo/shared/static';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import FormFieldError from '../FormFieldError';
import { Input } from '../Input';
import { TPhoneNumberInputBaseProps } from './types';
import { toNumericString } from './utils/toNumericString';

export function PhoneNumberInputBase(props: TPhoneNumberInputBaseProps) {
  const {
    phoneNumber = '',
    extension = '',
    onChangeParts,
    onBlur,
    noExtension,
    disabled,
    label,
    errors,
    style,
  } = props;

  const [localPhone, setLocalPhone] = useState(phoneNumber);
  const [localExt, setLocalExt] = useState(extension);

  useEffect(() => {
    onChangeParts?.(localPhone, localExt);
  }, [localPhone, localExt]);

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.inputRow]}>
        <Input
          value={localPhone}
          style={styles.number}
          disabled={disabled}
          keyboardType="number-pad"
          label={label}
          onChangeText={(text: string) => {
            setLocalPhone(toNumericString(text));
          }}
          onDelete={() => setLocalPhone('')}
          textContentType="telephoneNumber"
          onBlur={onBlur}
          maxLength={10}
        />

        {!noExtension && (
          <Input
            value={localExt}
            style={styles.extension}
            disabled={disabled}
            keyboardType="number-pad"
            onChangeText={(value: string) => {
              setLocalExt(toNumericString(value));
            }}
            onDelete={() => setLocalExt('')}
            onBlur={onBlur}
          />
        )}
      </View>
      {errors && <FormFieldError message={errors} />}
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
