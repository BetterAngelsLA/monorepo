import { CardWrapper } from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../../apollo';
import AddressAutocomplete from '../../../ui-components/AddressField';

const FIELD_NAME = 'mailingAddress';

type TForm = UpdateClientProfileInput | CreateClientProfileInput;

export default function MailingAddress() {
  const { control, setValue } = useFormContext<TForm>();

  const onReset = () => {
    setValue(FIELD_NAME, '');
  };

  return (
    <CardWrapper onReset={onReset} title="Personal Mailing Address">
      <AddressAutocomplete<TForm>
        name={FIELD_NAME}
        control={control}
        placeholder="Enter mailing address"
      />
    </CardWrapper>
  );
}
