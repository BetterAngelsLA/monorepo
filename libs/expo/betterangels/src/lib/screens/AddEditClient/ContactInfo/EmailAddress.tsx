import { Regex } from '@monorepo/expo/shared/static';
import { CardWrapper, Input } from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../../apollo';

export default function EmailAddress() {
  const {
    control,
    formState: { errors },
  } = useFormContext<UpdateClientProfileInput | CreateClientProfileInput>();

  return (
    <CardWrapper title="Email Address">
      <Input
        name="user.email"
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Enter email address"
        control={control}
        error={!!errors.user?.email}
        errorMessage={(errors.user?.email?.message as string) || undefined}
        rules={{
          validate: (value: string) => {
            if (value && !Regex.email.test(value)) {
              return 'Enter a valid email address';
            }
            return true;
          },
        }}
      />
    </CardWrapper>
  );
}
