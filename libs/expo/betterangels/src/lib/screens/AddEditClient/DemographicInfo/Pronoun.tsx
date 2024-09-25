import { Control, useFormContext } from 'react-hook-form';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../../apollo';
import { PronounPicker } from '../../../ui-components';

export default function Pronoun() {
  const { setValue, watch, control } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();
  const pronoun = watch('pronouns');

  return (
    <PronounPicker
      withCard
      cardTitle
      value={pronoun}
      onPress={(enumValue) => {
        setValue('pronouns', enumValue);
        if (enumValue !== 'OTHER') {
          setValue('pronounsOther', null);
        }
      }}
      otherName={`pronounsOther`}
      control={control as Control<CreateClientProfileInput>}
      onReset={() => {
        setValue('pronouns', null);
        setValue('pronounsOther', null);
      }}
    />
  );
}
