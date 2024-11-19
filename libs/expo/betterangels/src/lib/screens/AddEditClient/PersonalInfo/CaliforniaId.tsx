import { Regex } from '@monorepo/expo/shared/static';
import { CardWrapper, Input } from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../../apollo';

interface ICaliforniaIdProps {
  uniqueCheckError: string | undefined;
}

export default function CaliforniaId(props: ICaliforniaIdProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext<UpdateClientProfileInput | CreateClientProfileInput>();

  const { uniqueCheckError } = props;

  return (
    <CardWrapper title="CA ID #">
      <Input
        autoCapitalize="characters"
        autoCorrect={false}
        control={control}
        error={!!errors.californiaId}
        errorMessage={(errors.californiaId?.message as string) || undefined}
        name="californiaId"
        placeholder="Enter CA ID #"
        rules={{
          validate: (value: string) => {
            if (value && !Regex.californiaId.test(value)) {
              return 'CA ID must be 1 letter followed by 7 digits';
            }
            if (uniqueCheckError) {
              return uniqueCheckError;
            }
            return true;
          },
        }}
      />
    </CardWrapper>
  );
}
