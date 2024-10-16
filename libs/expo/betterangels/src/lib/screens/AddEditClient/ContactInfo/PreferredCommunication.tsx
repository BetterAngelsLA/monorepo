import { useFormContext } from 'react-hook-form';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../../apollo';
import { PreferredCommunicationPicker } from '../../../ui-components';

export default function PreferredCommunication() {
  const { setValue, watch } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();

  const preferredCommunication = watch('preferredCommunication') || [];

  return (
    <PreferredCommunicationPicker
      withCard
      cardTitle
      onPress={(enumValue) => {
        if (preferredCommunication.includes(enumValue)) {
          setValue(
            'preferredCommunication',
            preferredCommunication.filter((value) => value !== enumValue)
          );
          return;
        }
        setValue('preferredCommunication', [
          ...preferredCommunication,
          enumValue,
        ]);
      }}
      selected={preferredCommunication}
      onReset={() => setValue('preferredCommunication', [])}
    />
  );
}
