import { SingleInputForm } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { View } from 'react-native';

export function CustomFileNamePrompt({
  categoryName,
  onSubmit,
  onCancel,
}: {
  categoryName: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState('');

  return (
    <View style={{}}>
      <SingleInputForm
        value={value}
        placeholder="Enter file name"
        onChangeText={(v) => {
          console.log(v);
          setValue(v);
        }}
        onDone={() => console.log('DONE')}
        title="Other"
        subtitle="If you selected Other in Predefined file name, fill out the name of the file here."
        onClear={() => setValue('')}
        // ctaButton={<IconLabel icon="check">Confirm</IconLabel>}
        // isDoneDisabled={!isValidFilename(filename)}
      />
    </View>
  );
}
