import { Regex } from '@monorepo/expo/shared/static';
import { ControlledInput, Form } from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import { UpdateClientProfileInput } from '../../../apollo';
import AddressAutocomplete from '../../../ui-components/AddressField';
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
        <AddressAutocomplete<UpdateClientProfileInput>
          name="residenceAddress"
          control={control}
          placeholder="Enter residence address"
        />
      </Form.Field>

      <Form.Field title="Personal Mailing Address">
        <AddressAutocomplete<UpdateClientProfileInput>
          name="mailingAddress"
          control={control}
          placeholder="Enter personal mailing address"
        />
      </Form.Field>

      <PhoneNumber />

      <Form.Field title="Email Address">
        <ControlledInput
          name="user.email"
          placeholder="Enter email address"
          control={control}
          onDelete={() => setValue('user.email', '')}
          error={!!errors.email}
          errorMessage={(errors.email?.message as string) || undefined}
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
