import { useFormContext } from 'react-hook-form';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../../apollo';
import { MaritalStatusPicker } from '../../../ui-components';

export default function MaritalStatus() {
  const { setValue, watch } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();
  const maritalStatus = watch('maritalStatus');

  return (
    <MaritalStatusPicker
      withCard
      cardTitle
      value={maritalStatus}
      onPress={(enumValue) => {
        setValue('maritalStatus', enumValue);
      }}
      onReset={() => {
        setValue('maritalStatus', null);
      }}
    />
  );
}
