import { Spacings } from '@monorepo/expo/shared/static';
import { FormFieldError, Input } from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

export type TFeetInchesValue = {
  feet: string;
  inches: string;
};

type LengthInputProps = {
  label?: string;
  value?: TFeetInchesValue;
  onChange?: (nextValue: TFeetInchesValue) => void;
  error?: string;
};

const EMPTY_VALUE: TFeetInchesValue = { feet: '', inches: '' };

export function LengthInput(props: LengthInputProps) {
  const { label, value, onChange, error } = props;

  // Internal state so the component can be used in both controlled and uncontrolled modes.
  const [internalValue, setInternalValue] = useState<TFeetInchesValue>(
    value ?? EMPTY_VALUE
  );

  // If a controlled value is provided and it changes, sync internal state.
  useEffect(() => {
    if (!value) {
      return;
    }

    const hasChanged =
      value.feet !== internalValue.feet ||
      value.inches !== internalValue.inches;

    if (hasChanged) {
      setInternalValue(value);
    }
  }, [value, internalValue.feet, internalValue.inches]);

  function handleFeetChange(nextFeet: string) {
    const nextValue: TFeetInchesValue = {
      feet: nextFeet,
      inches: internalValue.inches,
    };

    setInternalValue(nextValue);

    if (onChange) {
      onChange(nextValue);
    }
  }

  function handleInchesChange(nextInches: string) {
    const nextValue: TFeetInchesValue = {
      feet: internalValue.feet,
      inches: nextInches,
    };

    setInternalValue(nextValue);

    if (onChange) {
      onChange(nextValue);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.column}>
          <Input
            maxLength={1}
            inputMode="numeric"
            label="Feet"
            placeholder="Feet"
            value={internalValue.feet}
            onChangeText={handleFeetChange}
            error={!!error}
          />
        </View>
        <View style={styles.column}>
          <Input
            maxLength={2}
            inputMode="numeric"
            label="Inches"
            placeholder="Inches"
            value={internalValue.inches}
            onChangeText={handleInchesChange}
            error={!!error}
          />
        </View>
      </View>
      {error && <FormFieldError message={error} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacings.xs,
  },
  row: {
    flexDirection: 'row',
    gap: Spacings.xs,
  },
  column: {
    flex: 1,
  },
});
