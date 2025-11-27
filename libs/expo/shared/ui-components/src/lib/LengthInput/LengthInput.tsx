import { Spacings } from '@monorepo/expo/shared/static';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import FormFieldError from '../FormFieldError';
import { Input } from '../Input';

export type TFeetInchesValue = {
  feet: string;
  inches: string;
};

type LengthInputProps = {
  value?: TFeetInchesValue;
  onChange?: (nextValue: TFeetInchesValue) => void;
  error?: string;
};

const EMPTY_VALUE: TFeetInchesValue = { feet: '', inches: '' };

export function LengthInput(props: LengthInputProps) {
  const { value, onChange, error } = props;

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] =
    useState<TFeetInchesValue>(EMPTY_VALUE);

  const currentValue = isControlled ? value! : internalValue;

  function normalizeInches(next: TFeetInchesValue): TFeetInchesValue {
    const inchesText = next.inches.trim();

    // If inches is blank or non-numeric, just leave as-is.
    const inchesNumber = Number(inchesText);

    if (inchesText === '' || Number.isNaN(inchesNumber)) {
      return next;
    }

    if (inchesNumber < 12) {
      return next;
    }

    const feetText = next.feet.trim();
    const feetNumber = Number(feetText);
    const extraFeet = Math.floor(inchesNumber / 12);
    const remainingInches = inchesNumber % 12;

    const baseFeet =
      feetText === '' || Number.isNaN(feetNumber) ? 0 : feetNumber;

    return {
      feet: String(baseFeet + extraFeet),
      inches: String(remainingInches),
    };
  }

  function updateValue(next: TFeetInchesValue) {
    const normalized = normalizeInches(next);

    if (!isControlled) {
      setInternalValue(normalized);
    }

    if (onChange) {
      onChange(normalized);
    }
  }

  function handleFeetChange(nextFeet: string) {
    const next: TFeetInchesValue = {
      feet: nextFeet,
      inches: currentValue.inches,
    };

    updateValue(next);
  }

  function handleInchesChange(nextInches: string) {
    const next: TFeetInchesValue = {
      feet: currentValue.feet,
      inches: nextInches,
    };

    updateValue(next);
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
            value={currentValue.feet}
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
            value={currentValue.inches}
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
