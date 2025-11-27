import { useEffect, useState } from 'react';
import { feetInchesToInches, inchesToFeetInches } from '../Length';
import { LengthInput, TFeetInchesValue } from './LengthInput';

type LengthInputInchesProps = {
  /**
   * The total length in inches as a string (for example, "66" for 5'6").
   * Can be undefined or empty when no height is set.
   */
  valueInches?: string;
  /**
   * Called with the total inches as a string when the user changes the input.
   * Will receive undefined if the input is effectively empty.
   */
  onChangeInches?: (nextInches: string | undefined) => void;
  error?: string;
};

const EMPTY_FEET_INCHES: TFeetInchesValue = { feet: '', inches: '' };

export function LengthInputInches(props: LengthInputInchesProps) {
  const { valueInches, onChangeInches, error } = props;

  const [internalValue, setInternalValue] =
    useState<TFeetInchesValue>(EMPTY_FEET_INCHES);

  /**
   * Sync from the external "total inches" → feet/inches.
   *
   * Behavior:
   * - If parent clears the value (undefined / ''), we clear the local inputs.
   * - If parent provides a number *and* our local inputs are still empty,
   *   we adopt the parent's value (initial prefill / form reset).
   * - After the user starts typing, internalValue is the source of truth
   *   and we do NOT overwrite it from valueInches on every change.
   */
  useEffect(() => {
    setInternalValue((previousValue) => {
      // Reset from parent
      if (valueInches === undefined || valueInches === '') {
        const alreadyEmpty =
          previousValue.feet === '' && previousValue.inches === '';

        if (alreadyEmpty) {
          return previousValue;
        }

        return EMPTY_FEET_INCHES;
      }

      const valueInchesNumber = Number(valueInches);

      if (Number.isNaN(valueInchesNumber)) {
        return previousValue;
      }

      const next = inchesToFeetInches(valueInchesNumber);

      const previousIsEmpty =
        previousValue.feet === '' && previousValue.inches === '';

      // Only adopt the parent-provided inches if we have not yet
      // accepted any user edits (initial load / prefill).
      if (!previousIsEmpty) {
        return previousValue;
      }

      return next;
    });
  }, [valueInches]);

  function emitChange(next: TFeetInchesValue) {
    if (!onChangeInches) {
      return;
    }

    const totalInches = feetInchesToInches(next.feet, next.inches);

    if (totalInches === undefined || totalInches === null) {
      onChangeInches(undefined);

      return;
    }

    onChangeInches(String(totalInches));
  }

  function handleFeetInchesChange(next: TFeetInchesValue) {
    setInternalValue(next);
    emitChange(next);
  }

  return (
    <LengthInput
      value={internalValue}
      onChange={handleFeetInchesChange}
      error={error}
    />
  );
}
