import { useFormContext } from 'react-hook-form';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../../apollo';
import { RacePicker } from '../../../ui-components';

export default function Race() {
  const { setValue, watch } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();
  const Race = watch('race');

  return (
    <RacePicker
      withCard
      cardTitle
      value={Race}
      onPress={(enumValue) => {
        setValue('race', enumValue);
      }}
      onReset={() => {
        setValue('race', null);
      }}
    />
  );
}
