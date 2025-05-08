import { Spacings } from '@monorepo/expo/shared/static';
import {
  feetInchesToInches,
  Form,
  inchesToFeetInches,
  Input,
} from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { View } from 'react-native';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../../../apollo';

export function Height() {
  const { setValue, getValues, watch } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();

  const heightInInchesDefault = watch('heightInInches');

  const [height, setHeight] = useState<{ feet: string; inches: string }>({
    feet: '',
    inches: '',
  });

  useEffect(() => {
    const heightInInches = feetInchesToInches(height.feet, height.inches);
    const currentHeightInInches = getValues('heightInInches');

    if (currentHeightInInches !== heightInInches) {
      setValue('heightInInches', heightInInches);
    }
  }, [height, setValue, getValues]);

  useEffect(() => {
    if (heightInInchesDefault) {
      const { feet, inches } = inchesToFeetInches(heightInInchesDefault);

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
            placeholder="Feet"
            value={height?.feet}
            onChangeText={(e) => setHeight({ ...height, feet: e })}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Input
            maxLength={2}
            label="Inches"
            placeholder="Inches"
            inputMode="numeric"
            value={height?.inches}
            onChangeText={(e) => setHeight({ ...height, inches: e })}
          />
        </View>
      </View>
    </Form.Field>
  );
}
