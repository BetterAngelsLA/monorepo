/**
 * BottomSheet-aware variant of BasicInput.
 *
 * Wraps BasicInput and integrates it with @gorhom/bottom-sheet so
 * the sheet correctly tracks focus and adjusts when the keyboard opens.
 *
 * Must be used inside a BottomSheet tree.
 */

import { useRef } from 'react';
import { TextInput } from 'react-native';
import BasicInput, { IBasicInputProps } from '../../BasicInput';
import { useBottomSheetKeyboardIntegration } from '../hooks';

export function BottomSheetBasicInput(props: IBasicInputProps) {
  const ref = useRef<TextInput>(null);

  const integration = useBottomSheetKeyboardIntegration(ref);

  return (
    <BasicInput
      {...props}
      ref={ref}
      onFocus={integration.handleOnFocus}
      onBlur={integration.handleOnBlur}
    />
  );
}
