import { Spacings } from '@monorepo/expo/shared/static';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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

  // `onChangeParts` and `onClear` are always passed as inline arrows, so their
  // identity changes on every parent render. They must therefore not be effect
  // dependencies: re-running the effect re-emits the current value upward, and
  // the parent forms subscribe to their own values (react-hook-form's
  // `useWatch`), so the emit re-renders the parent, which creates a new arrow,
  // which re-runs the effect -- an infinite render loop. Holding the latest
  // callbacks in refs lets the effect depend only on the values, so it re-emits
  // when something actually changed instead of on every parent render.
  const onChangePartsRef = useRef(onChangeParts);
  const onClearRef = useRef(onClear);

  // Layout effects flush before passive effects, so a changed callback is in
  // place before the effect below reads it.
  useLayoutEffect(() => {
    onChangePartsRef.current = onChangeParts;
    onClearRef.current = onClear;
  });

  useEffect(() => {
    onChangePartsRef.current?.(localPhone, localExt);

    const prevHasValue = existingHasValueRef.current;
    const newHasValue = localPhone || localExt;

    existingHasValueRef.current = !!newHasValue;

    if (prevHasValue && !newHasValue) {
      onClearRef.current?.();
    }
  }, [localPhone, localExt]);

  return (
    <View style={[style]}>
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  number: { flex: 2, marginRight: Spacings.xs },
  extension: { flex: 1 },
});
