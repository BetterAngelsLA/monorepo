import { BottomSheetInputForm } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { View } from 'react-native';

type TProps = {
  onSubmit: (value: string) => void;
};

export function CustomFileNamePrompt(props: TProps) {
  const { onSubmit } = props;

  const [value, setValue] = useState('');

  const trimmedValue = value.trim();

  const isSubmitDisabled = trimmedValue.length === 0;

  function handleSubmit() {
    if (isSubmitDisabled) {
      return;
    }

    onSubmit(trimmedValue);
  }

  return (
    <View style={{ flex: 1 }}>
      <BottomSheetInputForm
        value={value}
        inputPlaceholder="Enter file name"
        onChangeText={setValue}
        onDone={handleSubmit}
        onClear={() => setValue('')}
        title="Other"
        subtitle="If you selected Other in Predefined file name, fill out the name of the file here."
        ctaButtonText="Done"
        ctaDisabled={isSubmitDisabled}
      />
    </View>
  );
}
