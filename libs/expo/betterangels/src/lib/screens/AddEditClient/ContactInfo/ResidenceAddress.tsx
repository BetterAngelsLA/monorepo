import { CardWrapper } from '@monorepo/expo/shared/ui-components';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../../apollo';
import { AddressField } from '../../../ui-components';

const FIELD_KEY = 'residenceAddress';

type TForm = UpdateClientProfileInput | CreateClientProfileInput;

export default function ResidenceAddress() {
  const { setValue } = useFormContext<TForm>();

  const value = useWatch({ name: FIELD_KEY }) || '';

  const onReset = () => {
    setValue(FIELD_KEY, '');
  };

  const onChangeText = (input: string) => {
    setValue(FIELD_KEY, input);
  };

  return (
    <CardWrapper onReset={onReset} title="Residence Address">
      <AddressField
        value={value}
        placeholder="Enter residence address"
        onChange={onChangeText}
        onReset={onReset}
      />
    </CardWrapper>
  );
}
