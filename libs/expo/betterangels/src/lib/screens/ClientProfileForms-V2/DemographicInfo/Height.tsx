import { Spacings } from '@monorepo/expo/shared/static';
import { Form, Input_V2 as Input } from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { View } from 'react-native';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../../apollo';

export default function Height() {
  const { setValue, getValues, watch } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();

  const heightInInchesDefault = watch('heightInInches');

  const [height, setHeight] = useState<{ feet: string; inches: string }>({
    feet: '',
    inches: '',
  });

  useEffect(() => {
    const feetToInches = parseInt(height.feet, 10) || 0;
    const inches = parseInt(height.inches, 10) || 0;
    const heightInInches = feetToInches * 12 + inches;
    const currentHeightInInches = getValues('heightInInches');

    if (currentHeightInInches !== heightInInches) {
      setValue('heightInInches', heightInInches);
    }
  }, [height, setValue, getValues]);

  useEffect(() => {
    if (heightInInchesDefault) {
      const feet = Math.floor(heightInInchesDefault / 12).toString();
      const inches = (heightInInchesDefault % 12).toString();
      setHeight({ feet, inches });
    }
  }, [heightInInchesDefault]);

  return (
    <Form.Field title="Height">
      <View style={{ flexDirection: 'row', gap: Spacings.xs }}>
        <View style={{ flex: 1 }}>
          <Input
            maxLength={1}
            inputMode="numeric"
            label="Feet"
            value={height?.feet}
            onChangeText={(e) => setHeight({ ...height, feet: e })}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Input
            maxLength={2}
            label="Inches"
            inputMode="numeric"
            value={height?.inches}
            onChangeText={(e) => setHeight({ ...height, inches: e })}
          />
        </View>
      </View>
    </Form.Field>
  );
}
