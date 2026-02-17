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
