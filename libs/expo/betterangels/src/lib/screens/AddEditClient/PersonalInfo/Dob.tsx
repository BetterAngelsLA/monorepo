import { Regex } from '@monorepo/expo/shared/static';
import { CardWrapper, DatePicker } from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../../apollo';

export default function Dob() {
  const { setValue, watch } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();

  const dateOfBirth = watch('dateOfBirth');
  return (
    <CardWrapper title="Date of Birth">
      <DatePicker
        disabled
        maxDate={new Date()}
        pattern={Regex.date}
        mode="date"
        format="MM/dd/yyyy"
        placeholder="MM/DD/YYYY"
        minDate={new Date('1900-01-01')}
        mt="xs"
        value={dateOfBirth || new Date()}
        setValue={(date) => setValue('dateOfBirth', date)}
      />
    </CardWrapper>
  );
}
