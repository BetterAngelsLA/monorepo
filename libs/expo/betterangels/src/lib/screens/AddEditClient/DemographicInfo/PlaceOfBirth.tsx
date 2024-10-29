import { CardWrapper, Input } from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../../apollo';

export default function PlaceOfBirth() {
  const { control } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();

  return (
    <CardWrapper title="Place of Birth">
      <Input
        name="placeOfBirth"
        placeholder="Enter Place of Birth"
        control={control}
      />
    </CardWrapper>
  );
}
