import { CardWrapper, Input } from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../../apollo';

export default function CityOfBirth() {
  const { control } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();

  return (
    <CardWrapper title="City of Birth">
      <Input
        name="placeOfBirth"
        placeholder="Enter City of Birth"
        control={control}
      />
    </CardWrapper>
  );
}
