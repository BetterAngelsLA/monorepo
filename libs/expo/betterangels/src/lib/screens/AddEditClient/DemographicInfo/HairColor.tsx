import { useFormContext } from 'react-hook-form';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../../apollo';
import { HairColorPicker } from '../../../ui-components';

export default function HairColor() {
  const { setValue, watch } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();
  const hairColor = watch('hairColor');

  return (
    <HairColorPicker
      withCard
      cardTitle
      value={hairColor}
      onPress={(enumValue) => {
        setValue('hairColor', enumValue);
      }}
      onReset={() => {
        setValue('hairColor', null);
      }}
    />
  );
}
