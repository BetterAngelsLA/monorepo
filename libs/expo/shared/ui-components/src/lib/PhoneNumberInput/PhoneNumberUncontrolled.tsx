import { Spacings } from '@monorepo/expo/shared/static';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import FormFieldError from '../FormFieldError';
import { Input } from '../Input';
import { toNumericString } from './utils/toNumericString';

type TProps = {
  phoneNumber?: string;
  extension?: string;
  onChangeParts?: (phoneNumber: string, extension: string) => void;
  disabled?: boolean;
  label?: string;
  style?: ViewStyle;
  errors?: string;
  onBlur?: () => void;
};

export function PhoneNumberUncontrolled(props: TProps) {
  const {
    phoneNumber = '',
    extension = '',
    onChangeParts,
    onBlur,
    disabled,
    label,
    errors,
    style,
  } = props;

  const [localPhone, setLocalPhone] = useState(phoneNumber);
  const [localExt, setLocalExt] = useState(extension);

  const isMountedRef = useRef(false);

  // Set this after the first render
  useEffect(() => {
    // console.log('################################### MOUNTED NOW');
    // isMountedRef.current = true;
  }, []);

  useEffect(() => {
    console.log(
      '### ON CHANGE PARTS: isMountedRef.current: ',
      isMountedRef.current
    );

    if (!isMountedRef.current) {
      isMountedRef.current = true;
      console.log('######################### ON CHANGE PARTS - NOT MOUNTED');
      return;
    }

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

        <Input
          value={localExt}
          style={styles.extension}
          disabled={disabled}
          keyboardType="number-pad"
          onChangeText={(value: string) => {
            setLocalExt(toNumericString(value));
          }}
          onDelete={() => setLocalExt('')}
          // onBlur={onBlur}
        />
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
