import { CardWrapper, Textarea } from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../../apollo';

export default function PhysicalDescription() {
  const { control } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();

  return (
    <CardWrapper title="Physical Description">
      <Textarea
        name="physicalDescription"
        placeholder="Enter Physical Description"
        control={control}
      />
    </CardWrapper>
  );
}
