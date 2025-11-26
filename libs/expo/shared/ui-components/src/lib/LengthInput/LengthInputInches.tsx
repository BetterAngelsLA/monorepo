import {
  feetInchesToInches,
  inchesToFeetInches,
} from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { LengthInput, TFeetInchesValue } from './LengthInput';

type LengthInputInchesProps = {
  label?: string;
  /**
   * The total length in inches (for example, 66 for 5'6").
   * Can be undefined when no height is set.
   */
  valueInches?: number | null;
  /**
   * Called with the total inches when the user changes the input.
   * Will receive undefined if the input is effectively empty.
   */
  onChangeInches?: (nextInches: number | undefined) => void;
  error?: string;
};

export function LengthInputInches(props: LengthInputInchesProps) {
  const { label, valueInches, onChangeInches, error } = props;

  const [internalValue, setInternalValue] = useState<TFeetInchesValue>(() => {
    if (!valueInches) {
      return { feet: '', inches: '' };
    }

    return inchesToFeetInches(valueInches);
  });

  // Sync from external inches value → feet/inches when it changes.
  useEffect(() => {
    if (!valueInches) {
      setInternalValue({ feet: '', inches: '' });
      return;
    }

    const next = inchesToFeetInches(valueInches);

    const hasChanged =
      next.feet !== internalValue.feet || next.inches !== internalValue.inches;

    if (hasChanged) {
      setInternalValue(next);
    }
  }, [valueInches, internalValue.feet, internalValue.inches]);

  function handleFeetInchesChange(next: TFeetInchesValue) {
    setInternalValue(next);

    if (!onChangeInches) {
      return;
    }

    const totalInches = feetInchesToInches(next.feet, next.inches);

    if (!totalInches) {
      onChangeInches(undefined);
      return;
    }

    onChangeInches(totalInches);
  }

  return (
    <LengthInput
      label={label}
      value={internalValue}
      onChange={handleFeetInchesChange}
      error={error}
    />
  );
}
