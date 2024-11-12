import { Regex } from '@monorepo/expo/shared/static';
import { CardWrapper, Input } from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../../apollo';

export default function PlaceOfBirth() {
  const {
    control,
    formState: { errors },
  } = useFormContext<UpdateClientProfileInput | CreateClientProfileInput>();

  return (
    <CardWrapper title="CA ID #">
      <Input
        name="californiaId"
        autoCorrect={false}
        placeholder="Enter CA ID #"
        control={control}
        error={!!errors.californiaId}
        errorMessage={(errors.californiaId?.message as string) || undefined}
        rules={{
          validate: (value: string) => {
            if (value && !Regex.californiaId.test(value)) {
              return 'California ID must be 1 letter followed by 7 digits';
            }
            return true;
          },
        }}
      />
    </CardWrapper>
  );
}
