import { useFormContext } from 'react-hook-form';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../../apollo';
import { EyeColorPicker } from '../../../ui-components';

export default function EyeColor() {
  const { setValue, watch } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();
  const eyeColor = watch('eyeColor');

  return (
    <EyeColorPicker
      withCard
      cardTitle
      value={eyeColor}
      onPress={(enumValue) => {
        setValue('eyeColor', enumValue);
      }}
      onReset={() => {
        setValue('eyeColor', null);
      }}
    />
  );
}
