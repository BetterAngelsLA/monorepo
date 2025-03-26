import { Regex } from '@monorepo/expo/shared/static';
import { ControlledInput, Form } from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import { UpdateClientProfileInput } from '../../../apollo';
import PhoneNumber from './PhoneNumber';
import PreferredCommunication from './PreferredCommunication';
import SocialMedia from './SocialMedia';

export default function ContactInfo() {
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext<UpdateClientProfileInput>();

  return (
    <Form>
      <Form.Field title="Residence Address">
        <ControlledInput
          name="residenceAddress"
          placeholder="Enter residence address"
          control={control}
          onDelete={() => setValue('residenceAddress', '')}
        />
      </Form.Field>

      <Form.Field title="Personal Mailing Address">
        <ControlledInput
          name="mailingAddress"
          placeholder="Enter personal mailing address"
          control={control}
          onDelete={() => setValue('mailingAddress', '')}
        />
      </Form.Field>

      <PhoneNumber />

      <Form.Field title="Email Address">
        <ControlledInput
          name="user.email"
          placeholder="Enter email address"
          control={control}
          onDelete={() => setValue('user.email', '')}
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
      </Form.Field>

      <SocialMedia />

      <PreferredCommunication />
    </Form>
  );
}
