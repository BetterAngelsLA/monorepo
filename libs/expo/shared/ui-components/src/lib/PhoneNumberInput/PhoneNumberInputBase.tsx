import { Spacings } from '@monorepo/expo/shared/static';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import FormFieldError from '../FormFieldError';
import { Input } from '../Input';
import { TPhoneNumberInputBaseProps } from './types';
import { toNumericString } from './utils/toNumericString';

export function PhoneNumberInputBase(props: TPhoneNumberInputBaseProps) {
  const {
    phoneNumber,
    extension,
    placeholderNumber,
    placeholderExt,
    onChangeParts,
    onClear,
    noExtension,
    numberMaxLen = 10,
    extensionMaxLen,
    disabled,
    label,
    error,
    style,
  } = props;

  const [localPhone, setLocalPhone] = useState(phoneNumber ?? '');
  const [localExt, setLocalExt] = useState(extension ?? '');

  const existingHasValueRef = useRef(false);

  useEffect(() => {
    onChangeParts?.(localPhone, localExt);

    const prevHasValue = existingHasValueRef.current;
    const newHasValue = localPhone || localExt;

    existingHasValueRef.current = !!newHasValue;

    if (prevHasValue && !newHasValue) {
      onClear?.();
    }
  }, [localPhone, localExt]);

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.inputRow]}>
        <Input
          value={localPhone}
          style={styles.number}
          placeholder={placeholderNumber}
          disabled={disabled}
          keyboardType="number-pad"
          textContentType="telephoneNumber"
          label={label}
          onChangeText={(value: string) =>
            setLocalPhone(toNumericString(value))
          }
          onDelete={() => setLocalPhone('')}
          maxLength={numberMaxLen}
        />

        {!noExtension && (
          <Input
            value={localExt}
            placeholder={placeholderExt}
            style={styles.extension}
            disabled={disabled}
            keyboardType="number-pad"
            onChangeText={(value: string) =>
              setLocalExt(toNumericString(value))
            }
            onDelete={() => setLocalExt('')}
            maxLength={extensionMaxLen}
          />
        )}
      </View>
      {error && <FormFieldError message={error} />}
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
