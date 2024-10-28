import { Control, RegisterOptions } from 'react-hook-form';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../../../apollo';
import AddressAutocomplete from '../../../../ui-components/AddressField';

type TForm = UpdateClientProfileInput | CreateClientProfileInput;

type TContactAddress = {
  name: `contacts[${number}].mailingAddress`;
  control: Control<TForm, any>;
  rules?: Pick<RegisterOptions, 'minLength'>;
};

export default function ContactAddress(props: TContactAddress) {
  const { control, name, rules } = props;

  return (
    <AddressAutocomplete<TForm>
      name={name as `contacts.${number}.mailingAddress`}
      control={control}
      label="Mailing Address label"
      placeholder="Mailing Address placeh"
    />
  );
}
