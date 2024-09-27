import { Control, useFormContext } from 'react-hook-form';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../../apollo';
import { GenderPicker } from '../../../ui-components';

export default function Gender() {
  const { setValue, watch, control } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();
  const gender = watch('gender');

  return (
    <GenderPicker
      withCard
      cardTitle
      value={gender}
      onPress={(enumValue) => {
        setValue('gender', enumValue);
        if (enumValue !== 'OTHER') {
          setValue('genderOther', null);
        }
      }}
      otherName={`genderOther`}
      control={control as Control<CreateClientProfileInput>}
      onReset={() => {
        setValue('gender', null);
        setValue('genderOther', null);
      }}
    />
  );
}
