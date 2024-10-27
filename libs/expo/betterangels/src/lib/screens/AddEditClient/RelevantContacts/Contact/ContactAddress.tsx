import { Control, Controller, RegisterOptions } from 'react-hook-form';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../../../apollo';
import { AddressField } from '../../../../ui-components';

type TContactAddress = {
  name: `contacts[${number}].mailingAddress`;
  control: Control<UpdateClientProfileInput | CreateClientProfileInput, any>;
  rules?: Pick<RegisterOptions, 'minLength'>;
};

export default function ContactAddress(props: TContactAddress) {
  const { control, name, rules } = props;

  return (
    <Controller
      name={name as `contacts.${number}.mailingAddress`}
      control={control}
      rules={rules}
      render={({
        field: { onChange, onBlur, value },
        fieldState: { error },
      }) => (
        <AddressField
          value={value || ''}
          label="Mailing Address"
          placeholder="Mailing Address"
          onChange={onChange}
          onBlur={onBlur}
          onReset={() => onChange('')}
          errorMessage={error?.message}
        />
      )}
    />
  );
}
