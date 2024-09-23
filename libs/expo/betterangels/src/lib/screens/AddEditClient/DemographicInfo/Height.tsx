import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  CardWrapper,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { View } from 'react-native';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../../apollo';

export default function Height() {
  const { setValue, getValues } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();
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

  return (
    <CardWrapper title="Height">
      <View style={{ flexDirection: 'row', gap: Spacings.xs }}>
        <View style={{ flex: 1 }}>
          <BasicInput
            maxLength={1}
            inputMode="numeric"
            label="Feet"
            value={height?.feet}
            onChangeText={(e) => setHeight({ ...height, feet: e })}
          />
        </View>
        <View style={{ flex: 1 }}>
          <BasicInput
            maxLength={2}
            label="Inches"
            inputMode="numeric"
            value={height?.inches}
            onChangeText={(e) => setHeight({ ...height, inches: e })}
          />
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <TextButton
          mt="sm"
          color={Colors.PRIMARY}
          title="Reset"
          accessibilityHint="resets Hair Color"
          onPress={() => {
            setHeight({ feet: '', inches: '' });
            setValue('heightInInches', null);
          }}
        />
      </View>
    </CardWrapper>
  );
}
